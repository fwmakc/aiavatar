export type ContentType =
  | 'news'
  | 'joke'
  | 'quiz'
  | 'challenge';

export interface ContentItem {
  type: ContentType;
  text: string;
  link?: string;
  options?: string[]; // for quiz
  correctIndex?: number; // for quiz
  tags?: string[];
}

export interface PostedContent {
  id: string; // link, quoteId, text hash, etc.
  text: string;
  type: ContentType;
  time: number;
}

export interface ChatEngagementState {
  chatId: number;
  lastMessageTime: number;
  lastContentPostTime: number;
  contentHistory: ContentType[];
  postedContent: PostedContent[]; // deduplication history
  activeQuiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    participants: Map<number, number>; // userId -> chosenIndex
  };
}
