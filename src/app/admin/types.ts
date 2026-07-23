export type PendingReport = {
  id: string;
  reason: string;
  created_at: string;
  reporter: { username: string } | null;
  post: {
    id: string;
    content: string;
    users: { username: string } | null;
  } | null;
};

export type Prompt = {
  id: string;
  category: string;
  content: string;
  week_start: string;
};

export type Stats = {
  totalUsers: number;
  totalCircles: number;
  totalPosts: number;
  pendingReports: number;
  resolvedThisWeek: number;
};

export type Resource = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  url: string | null;
  category: string | null;
};
