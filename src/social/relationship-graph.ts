import { readFileSync, writeFileSync, existsSync } from 'fs';

interface Edge {
  targetUserId: number;
  weight: number;        // -10 (враги) .. +10 (братья)
  interactionCount: number;
  lastConflict: number;
  lastPositive: number;
}

interface GraphData {
  [userId: string]: Edge[];
}

const GRAPH_FILE = 'social-graph.json';

export class RelationshipGraph {
  private data = new Map<number, Edge[]>();

  constructor() {
    this.load();
  }

  private getEdges(userId: number): Edge[] {
    return this.data.get(userId) || [];
  }

  private findEdge(userId: number, targetId: number): Edge | undefined {
    return this.getEdges(userId).find(e => e.targetUserId === targetId);
  }

  updateInteraction(
    fromUserId: number,
    toUserId: number,
    tone: string,
    isReply: boolean
  ): void {
    if (fromUserId === toUserId) return;

    const edges = this.getEdges(fromUserId);
    let edge = this.findEdge(fromUserId, toUserId);

    if (!edge) {
      edge = {
        targetUserId: toUserId,
        weight: 0,
        interactionCount: 0,
        lastConflict: 0,
        lastPositive: 0,
      };
      edges.push(edge);
    }

    edge.interactionCount++;

    // Начисляем weight по тону
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
      delta = isReply ? +1 : 0; // Простое упоминание без reply — нейтрально
    }

    edge.weight = Math.max(-10, Math.min(10, edge.weight + delta));
    this.data.set(fromUserId, edges);
    this.save();
  }

  getWeight(fromUserId: number, toUserId: number): number {
    return this.findEdge(fromUserId, toUserId)?.weight || 0;
  }

  getAllEdges(userId: number): Edge[] {
    return [...this.getEdges(userId)];
  }

  findConflictPair(chatMembers: number[]): [number, number] | null {
    // Ищем пару с наибольшим негативным weight
    let worstPair: [number, number] | null = null;
    let worstScore = -1;

    for (const uid of chatMembers) {
      for (const edge of this.getEdges(uid)) {
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

  private save(): void {
    const obj: GraphData = {};
    for (const [key, value] of this.data) {
      obj[String(key)] = value;
    }
    writeFileSync(GRAPH_FILE, JSON.stringify(obj, null, 2));
  }

  private load(): void {
    if (!existsSync(GRAPH_FILE)) return;
    try {
      const raw = readFileSync(GRAPH_FILE, 'utf-8');
      const obj = JSON.parse(raw) as GraphData;
      for (const [key, value] of Object.entries(obj)) {
        this.data.set(Number(key), value);
      }
    } catch (e) {
      console.error('Failed to load social graph:', (e as Error).message);
    }
  }
}

export const relationshipGraph = new RelationshipGraph();
