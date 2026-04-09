export type Task = {
  id: number;
  title: string;
  dueDate: string;
  status: "pending" | "completed";
  priority: "high" | "medium" | "low";
  subject: string;
  course: string;
};

export type GroupSession = {
  id: string;
  title: string;
  subject: string;
  startsAt: string;
  isLive: boolean;
  isPrivate: boolean;
  sessionCode: string;
  hostUserId: string;
  memberCount: number;
  joined: boolean;
};

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id?: string;
  user_id?: string;
  material_id?: string;
  title: string;
  topic: string;
  questions: Question[];
  created_at?: string;
}

export interface Material {
  id: string;
  user_id: string;
  title: string;
  file_url: string;
  file_type: string;
  size_bytes: number;
  created_at: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  created_at: string;
}
