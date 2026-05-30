import type { Context } from 'telegraf';
import { config } from '@/config/env';
import { buildSystemPrompt } from '@/config/persona';
import { getPeoplePromptAddon } from '@/people/prompt';
import { bot } from '@/telegram/bot';
import { askAI } from '@/ai/client';
import { analyzeTone, analyzeAttitudeTowardsBot } from '@/ai/tone-analyzer';
import { shouldAnswerGroup, guardCheck, guardCheckPrivate, topicGuard, generateDenial } from '@/ai/screening';
import { relationships } from '@/relationship/manager';
import { banManager } from '@/ban/manager';
import { groupContextManager } from '@/group/context';
import { privateContextManager } from '@/private-context';
import { relationshipGraph } from '@/social/relationship-graph';
import { userProfileManager } from '@/social/user-profile';
import { generateIntervention, shouldIntervene } from '@/social/intervention';
import { generatePersonalProfile, getReconciliationOpening, processReconciliation } from '@/social/personal-profile';
import { onGroupMessage } from '@/content/scheduler';
import { pickReaction } from '@/reactions/engine';
import { canReplyInGroup, recordGroupReply } from '@/group/rate-limiter';
import { isQuietTime } from '@/schedule/checker';

function isAllowedUser(ctx: Context): boolean {
  const userId = String(ctx.from?.id ?? '');
  const username = ctx.from?.username ?? '';
  return config.allowedUsers.includes(userId) || config.allowedUsers.includes(username);
}

export function setupMessageHandler(): void {
  // === ЛС: автопредложение перемирия при отрицательном score ===
  bot.use(async (ctx, next) => {
    if (ctx.chat?.type === 'private' && ctx.from?.id) {
      const userId = ctx.from.id;
      const score = relationships.get(userId, userId).score;
      const text = (ctx.message as any)?.text || '';

      if (score <= -2 && !text.startsWith('/') && Math.random() < 0.2) {
        const opening = getReconciliationOpening(userId);
        if (opening) {
          await ctx.reply(opening);
          return; // Не вызываем next — бот ждёт ответа
        }
      }
    }
    await next();
  });

  // Команда /analyze — ручной анализ чата
  bot.command('analyze', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !isAllowedUser(ctx)) {
      await ctx.reply('Нет доступа.');
      return;
    }

    const chatId = ctx.chat.id;
    const isPrivate = ctx.chat.type === 'private';

    await ctx.reply('🔍 Анализирую накопленные данные...');

    // Профили
    const profiles = isPrivate
      ? [userProfileManager.getProfile(userId)].filter(Boolean)
      : Array.from(new Set(groupContextManager.get(chatId).messages.map(m => m.author)))
          .map(name => {
            // Ищем userId по имени (грубое сопоставление)
            return null; // TODO: нужен reverse-lookup
          });

    // Граф связей
    const chatMembers = isPrivate ? [userId] : [];
    const conflictPair = relationshipGraph.findConflictPair(chatMembers);

    let report = '📊 *Социальный рапорт*\n\n';

    if (conflictPair) {
      report += `⚠️ Обнаружена напряжённая пара: ${conflictPair[0]} ↔ ${conflictPair[1]}\n`;
      report += `Вес связи: ${relationshipGraph.getWeight(conflictPair[0], conflictPair[1])}\n\n`;
    }

    const aggressive = userProfileManager.getAggressiveUsers(0.3);
    if (aggressive.length > 0) {
      report += `🔥 Токсичные участники:\n`;
      for (const p of aggressive.slice(0, 5)) {
        report += `- ${p.firstName || p.username || p.userId}: агрессия ${(p.aggressionRate * 100).toFixed(0)}%\n`;
      }
    } else {
      report += '✅ Токсичность в норме\n';
    }

    await ctx.reply(report, { parse_mode: 'Markdown' });
  });

  // === ЛС: персональный профиль ===
  bot.command('profile', async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.reply('🔍 Анализирую твои данные...');
    const profile = await generatePersonalProfile(userId);
    await ctx.reply(profile, { parse_mode: 'Markdown' });
  });

  // === ЛС: помириться с ботом ===
  bot.command('reconcile', async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    const userId = ctx.from?.id;
    if (!userId) return;

    const score = relationships.get(userId, userId).score;
    if (score >= 0) {
      await ctx.reply('У нас с тобой всё хорошо! Зачем мириться? 😊');
      return;
    }

    const opening = getReconciliationOpening(userId);
    if (opening) {
      await ctx.reply(opening);
    } else {
      await ctx.reply('Что ты хочешь сказать?');
    }
  });

  bot.on('message', async (ctx) => {
    try {
      const messageText = (ctx.message as any).text;
      if (!messageText) return;

      const userId = ctx.from?.id;
      const chatId = ctx.chat.id;

      const isPrivate = ctx.chat.type === 'private';
      const isReplyToBot = (ctx.message as any).reply_to_message?.from?.username === config.botUsername;
      const mentionsBot = messageText.includes(`@${config.botUsername}`);
      const isDirectInteraction = isPrivate || isReplyToBot || mentionsBot;

      // Track group activity for content engine
      if (!isPrivate) {
        onGroupMessage(chatId);
      }



      // Тон-анализ: по отношению к боту для direct interaction, общий тон для группы
      let tone = 'нейтральный';
      if (isDirectInteraction) {
        tone = await analyzeAttitudeTowardsBot(messageText);
      } else {
        const userHistory = isPrivate
          ? privateContextManager.getMessages(userId!)
          : groupContextManager.getMessagesByAuthor(chatId, ctx.from?.username || ctx.from?.first_name || 'Unknown');
        const lastUserMessages = userHistory.slice(-2);
        if (lastUserMessages.length > 0) {
          tone = await analyzeTone(lastUserMessages);
        }
      }

      // Накопление контекста
      if (!isPrivate && config.groupActiveMode) {
        const authorName = ctx.from?.username || ctx.from?.first_name || 'Unknown';
        groupContextManager.addMessage(chatId, authorName, messageText);
        // Analyze tone of THIS message specifically for reply chain accuracy
        const msgTone = await analyzeTone([{ text: messageText }]);
        console.log(`[ReplyChain] chat ${chatId}: tone=${msgTone} → "${messageText.slice(0, 40)}"`);
        groupContextManager.addReplyChain(chatId, userId!, authorName, msgTone, messageText);
      } else if (isPrivate && userId) {
        privateContextManager.addMessage(userId, messageText, false);
      }

      // Реакции в группе (лёгкий фидбек без слов)
      if (!isPrivate && Math.random() < 0.25) {
        const reaction = await pickReaction(messageText);
        if (reaction && (ctx.message as any).message_id) {
          try {
            await bot.telegram.setMessageReaction(chatId, (ctx.message as any).message_id, [
              { type: 'emoji', emoji: reaction },
            ]);
            console.log(`[Reaction] chat ${chatId}: ${reaction} → "${messageText.slice(0, 40)}"`);
          } catch {
            // Invalid reaction or no permission — silently skip
          }
        }
      }

      // Определяем, стоит ли отвечать
      let shouldReply = false;
      let isInterestReply = false;

      if (isPrivate) {
        if (!isAllowedUser(ctx)) {
          console.log(`Access denied for user: ${ctx.from?.username || ctx.from?.id}`);
          return;
        }
        shouldReply = true;
      } else {
        if (isReplyToBot || mentionsBot) {
          shouldReply = true;
        } else {
          // Проверяем, не чужой ли разговор (reply другому / тег другого)
          const replyToOther = (ctx.message as any).reply_to_message?.from?.username !== config.botUsername && !!(ctx.message as any).reply_to_message;
          const hasMentionToOther = /@[a-zA-Z0-9_]/.test(messageText) && !mentionsBot;

          if (replyToOther || hasMentionToOther) {
            // Чужой разговор — проверяем, не накаляется ли ситуация
            const chain = groupContextManager.getReplyChain(chatId);
            const isHeatingUp = shouldIntervene(chatId, chain.map(c => ({ userId: c.userId, tone: c.tone })), config.groupActiveMode);
            if (isHeatingUp) {
              console.log(`[Group] chat ${chatId}: чужой разговор, но ситуация накаляется — вмешиваюсь`);
              shouldReply = true;
            } else {
              console.log(`[Group] chat ${chatId}: чужой разговор, всё тихо — молчу`);
              shouldReply = false;
            }
          } else if (config.groupActiveMode && groupContextManager.shouldScreen(chatId)) {
            if (isQuietTime(chatId)) {
              console.log(`[Group] chat ${chatId}: тихие часы, пропускаю скрининг`);
              groupContextManager.get(chatId).lastScreening = Date.now();
            } else {
              const isInteresting = await shouldAnswerGroup(chatId);
              if (isInteresting) {
                shouldReply = true;
                isInterestReply = true;
              } else {
                groupContextManager.get(chatId).lastScreening = Date.now();
              }
            }
          }
        }
      }

      if (!shouldReply) {
        if (!isPrivate) {
          await checkAndIntervene(chatId);
          console.log(`[Group] chat ${chatId}: молчу (не тегают / неинтересно)`);
        }
        return;
      }

      if (!isPrivate) {
        if (isInterestReply) {
          // Rate limit only for interest replies
          const limit = canReplyInGroup(chatId);
          if (!limit.allowed) {
            console.log(`[Group] chat ${chatId}: лимит ответов исчерпан, сплю`);
            return;
          }
          console.log(`[Group] chat ${chatId}: отвечаю по интересу`);
        } else if (isReplyToBot || mentionsBot) {
          console.log(`[Group] chat ${chatId}: отвечаю на прямое обращение`);
        }
      }

      // Показываем "печатает..." пока думаем
      await ctx.sendChatAction('typing');

      // Бан-чек: только при прямом обращении (ЛС или reply/mention в группе)
      if (userId && isDirectInteraction && banManager.isBanned(chatId, userId)) {
        console.log(`User ${userId} banned, ignoring direct interaction`);
        return;
      }

      const cleanText = messageText.replace(`@${config.botUsername}`, '').trim();

      // Guard
      let guardPassed = true;
      if (config.guardEnabled) {
        if (!isPrivate && (isReplyToBot || mentionsBot)) {
          guardPassed = await guardCheck(chatId, ctx.chat.title, cleanText);
        } else if (isPrivate && userId) {
          guardPassed = await guardCheckPrivate(userId, cleanText);
        }
      }

      if (!guardPassed) {
        console.log(`Guard blocked: ${cleanText.slice(0, 50)}`);
        if (userId) {
          relationships.addScore(chatId, userId, -2, 'троллинг');

          const justBanned = banManager.recordDenial(chatId, userId);
          if (justBanned) {
            console.log(`User ${userId} banned silently`);
            return;
          }
        }

        const denial = await generateDenial(cleanText, 'role');
        await ctx.reply(denial, { reply_to_message_id: (ctx.message as any).message_id });
        return;
      }

      // Topic guard + mat analysis — only for direct interactions (private / reply / mention)
      if (isDirectInteraction) {
        const onTopic = await topicGuard(cleanText);
        if (!onTopic) {
          console.log(`Topic guard blocked: ${cleanText.slice(0, 50)}`);
          const denial = await generateDenial(cleanText, 'topic');
          await ctx.reply(denial, { reply_to_message_id: (ctx.message as any).message_id });
          return;
        }


      }

      if (userId && config.titForTatMode) {
        if (tone === 'льстивый' || tone === 'льстивое') {
          relationships.addScore(chatId, userId, +2, 'комплимент/лесть');
        } else if (tone === 'весёлый' || tone === 'дружелюбное') {
          relationships.addScore(chatId, userId, +1, 'позитивный настрой');
        } else if (tone === 'агрессивный' || tone === 'оскорбительный' || tone === 'агрессивное' || tone === 'оскорбительное') {
          relationships.addScore(chatId, userId, -2, 'агрессия в тоне');
        } else if (tone === 'холодное') {
          relationships.addScore(chatId, userId, -1, 'холодное отношение');
        }
      }

      if (userId) {
        const currentScore = relationships.get(chatId, userId).score;
        const isRehab = config.titForTatMode && currentScore < 0;
        const baseDelta = isRehab ? +2 : +1;
        relationships.addScore(chatId, userId, baseDelta, isRehab ? 'реабилитация' : 'обычное общение');
      }

      // Генерация ответа
      const relPrompt = userId ? relationships.getPromptAddon(chatId, userId) : '';
      const slangPrompt = '\n\nВажно: не перегружай ответ IT-сленгом. Используй профессиональные термины уместно и редко, как приправу. Говори просто, как нормальный человек, а не как техдокументация.';
      const noQuestionPrompt = '\n\nВажно: НЕ задавай вопросов в конце ответа. Не спрашивай "хочешь узнать", "нужна помощь", "давай расскажу" — просто скажи что думаешь и всё. Не пытаться продолжить разговор принудительно.';
      const noInsultPrompt = '\n\nКРАСНАЯ ЛИНИЯ: никогда не оскорбляй собеседника, не унижай его, не используй шутки про маму/родных/внешность/национальность. Если тебя оскорбляют — можешь дать отпор резко, но не переходи на личности. Будь жёстким в словах, но не мерзким.';
      const peoplePrompt = userId ? getPeoplePromptAddon(userId) : '';
      const basePrompt = buildSystemPrompt(chatId, isPrivate ? (userId ?? undefined) : undefined);
      const fullSystemPrompt = `${basePrompt}\n\n${relPrompt}${peoplePrompt}${slangPrompt}${noQuestionPrompt}${noInsultPrompt}`;

      let aiReply: string;
      // Режим помирования в ЛС (score < 0)
      if (isPrivate && userId && relationships.get(userId, userId).score < 0) {
        aiReply = await processReconciliation(userId, cleanText);
        // Каждое сообщение в режиме помирования улучшает отношения
        relationships.addScore(userId, userId, +1, 'попытка наладить контакт');
      } else {
        aiReply = await askAI(cleanText, fullSystemPrompt, tone);
      }

      await ctx.reply(aiReply, { reply_to_message_id: (ctx.message as any).message_id });

      if (!isPrivate && isInterestReply) {
        recordGroupReply(chatId);
      }

      // Успех — сбрасываем бан-нарушения
      if (userId) {
        banManager.resetViolations(chatId, userId);
      }

      // Сохраняем контекст
      if (isPrivate && userId) {
        privateContextManager.addMessage(userId, aiReply, true);
      } else {
        groupContextManager.markBotReply(chatId);
      }
    } catch (error) {
      console.error('Ошибка AI Client API или Telegram:', error);
      try {
        await ctx.reply('Ошибка. Завис немного 😅', {
          reply_to_message_id: (ctx.message as any).message_id,
        });
      } catch (replyErr) {
        console.error('Не удалось отправить сообщение об ошибке:', replyErr);
      }
    }
  });
}

// === Социальное вмешательство ===
async function checkAndIntervene(chatId: number): Promise<void> {
  const chain = groupContextManager.getReplyChain(chatId);
  if (chain.length < 3) return;

  // Проверяем, нужно ли вмешиваться
  const isHeating = shouldIntervene(chatId, chain.map(c => ({ userId: c.userId, tone: c.tone })), config.groupActiveMode);
  if (!isHeating) {
    console.log(`[Intervention] chat ${chatId}: спокойно`);
    return;
  }
  console.log(`[Intervention] chat ${chatId}: накал обнаружен, готовлю вмешательство`);

  // Собираем контекст конфликта
  const recent = chain.slice(-6);
  const participantIds = [...new Set(recent.map(c => c.userId))];
  if (participantIds.length < 1) return;

  const participants = participantIds.map(uid => ({
    userId: uid,
    name: recent.find(c => c.userId === uid)?.author || 'Unknown',
    recentMessages: recent.filter(c => c.userId === uid).map(c => c.text),
  }));

  const topic = recent[recent.length - 1].text.slice(0, 100);

  const intervention = await generateIntervention({
    participants,
    topic,
    escalationLevel: Math.min(5, recent.filter(c => c.tone === 'агрессивный').length),
  });

  if (intervention) {
    console.log(`[Intervention] chat ${chatId}: отправляю вмешательство`);
    await bot.telegram.sendMessage(chatId, intervention);
    groupContextManager.clearReplyChain(chatId);
  } else {
    console.log(`[Intervention] chat ${chatId}: накал есть, но не придумал что сказать`);
  }
}
