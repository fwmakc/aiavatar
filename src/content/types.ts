export type ContentType =
  | 'feed'
  | 'quiz'
  | 'challenge';

export interface FeedSource {
  url: string;
  type: 'rss' | 'json';
  path?: string;
  weight?: number;
  comment?: boolean;
  commentPrompt?: string;
  translate?: boolean;
  scheduled?: string[];
}

export interface ContentItem {
  type: ContentType;
  text: string;
  link?: string;
  options?: string[];
  correctIndex?: number;
  tags?: string[];
}

export interface PostedContent {
  id: string;
  text: string;
  type: ContentType;
  time: number;
}

export interface ChatEngagementState {
  chatId: number;
  lastMessageTime: number;
  lastContentPostTime: number;
  contentHistory: ContentType[];
  postedContent: PostedContent[];
  activeQuiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    participants: Map<number, number>;
  };
}
