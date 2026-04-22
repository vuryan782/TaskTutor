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
