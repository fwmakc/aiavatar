import { db } from '@/db';

interface Edge {
  targetUserId: number;
  weight: number;
  interactionCount: number;
  lastConflict: number;
  lastPositive: number;
}

const stmtGet = db.prepare('SELECT * FROM social_graph WHERE from_user_id = ? AND to_user_id = ?');

const stmtGetAll = db.prepare('SELECT * FROM social_graph WHERE from_user_id = ?');

const stmtUpsert = db.prepare(
  `INSERT INTO social_graph (from_user_id, to_user_id, weight, interaction_count, last_conflict, last_positive)
   VALUES (?, ?, ?, ?, ?, ?)
   ON CONFLICT(from_user_id, to_user_id) DO UPDATE SET
     weight = excluded.weight,
     interaction_count = excluded.interaction_count,
     last_conflict = excluded.last_conflict,
     last_positive = excluded.last_positive`
);

function rowToEdge(row: any): Edge {
  return {
    targetUserId: row.to_user_id,
    weight: row.weight,
    interactionCount: row.interaction_count,
    lastConflict: row.last_conflict,
    lastPositive: row.last_positive,
  };
}

export function updateGraphInteraction(
  fromUserId: number,
  toUserId: number,
  tone: string,
  isReply: boolean
): void {
  if (fromUserId === toUserId) return;

  const row = stmtGet.get(fromUserId, toUserId);
  const edge: Edge = row
    ? rowToEdge(row)
    : {
        targetUserId: toUserId,
        weight: 0,
        interactionCount: 0,
        lastConflict: 0,
        lastPositive: 0,
      };

  edge.interactionCount++;

  let delta = 0;
  if (tone === 'льстивый' || tone === 'весёлый') {
    delta = +2;
    edge.lastPositive = Date.now();
  } else if (tone === 'агрессивный' || tone === 'оскорбительный') {
    delta = -3;
    edge.lastConflict = Date.now();
  } else if (tone === 'саркастичный') {
    delta = -1;
  } else {
    delta = isReply ? +1 : 0;
  }

  edge.weight = Math.max(-10, Math.min(10, edge.weight + delta));

  stmtUpsert.run(
    fromUserId,
    toUserId,
    edge.weight,
    edge.interactionCount,
    edge.lastConflict,
    edge.lastPositive
  );
}

export function getGraphWeight(fromUserId: number, toUserId: number): number {
  const row = stmtGet.get(fromUserId, toUserId) as { weight: number } | undefined;
  return row?.weight ?? 0;
}

export function getGraphEdges(userId: number): Edge[] {
  return (stmtGetAll.all(userId) as any[]).map(rowToEdge);
}

export function findConflictPair(chatMembers: number[]): [number, number] | null {
  let worstPair: [number, number] | null = null;
  let worstScore = -1;

  for (const uid of chatMembers) {
    for (const edge of getGraphEdges(uid)) {
      if (chatMembers.includes(edge.targetUserId)) {
        const score = Math.abs(edge.weight);
        if (edge.weight < -3 && score > worstScore) {
          worstScore = score;
          worstPair = [uid, edge.targetUserId];
        }
      }
    }
  }

  return worstPair;
}

// Backward-compatible singleton wrapper
class RelationshipGraph {
  updateInteraction(fromUserId: number, toUserId: number, tone: string, isReply: boolean): void {
    updateGraphInteraction(fromUserId, toUserId, tone, isReply);
  }

  getWeight(fromUserId: number, toUserId: number): number {
    return getGraphWeight(fromUserId, toUserId);
  }

  getAllEdges(userId: number): Edge[] {
    return getGraphEdges(userId);
  }

  findConflictPair(chatMembers: number[]): [number, number] | null {
    return findConflictPair(chatMembers);
  }
}

export const relationshipGraph = new RelationshipGraph();
