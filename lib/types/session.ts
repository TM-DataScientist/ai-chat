export type Model = "gpt-4o" | "gpt-4o-mini";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  createdAt?: string;
}

// サイドバー一覧用（messages は含まない）
export interface SessionSummary {
  _id: string;
  title: string;
  model: Model;
  createdAt: string;
  updatedAt: string;
}

// セッション詳細（messages 含む）
export interface SessionDetail extends SessionSummary {
  messages: ChatMessage[];
}
