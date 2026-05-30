# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Modular persona via JSON configs (`data/default.json`, `data/chats/`, `data/personal_chats/`)
- Per-user social profiles (`data/users/`)
- Content engine with adaptive scheduling (news, jokes, quizzes, challenges)
- Deduplication to prevent reposting the same content
- Quiet hours and quiet days configuration
- Social intervention in group conflicts
- Relationship tracking (TIT FOR TAT) per chat per user
- Tone analysis for direct and group interactions
- Ban system (2 guard denials = 24h ban)
- Rate limiting for proactive group replies
- Emoji reactions on group messages
- Context-aware replies using message history
- Hot reload for all JSON configs via `fs.watch`
- Docker and docker-compose support
- CI/CD with GitHub Actions

## [0.1.0] - 2026-05-30

### Added
- Initial release
- Telegram bot with TypeScript and Vite
- Anthropic-compatible AI backend (Kimi)
- HTTP proxy support for Telegram API
- Basic message handling in groups and DMs
