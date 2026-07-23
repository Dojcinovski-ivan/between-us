import type { ReactionType } from "@/lib/reactions";

export type Post = {
  id: string;
  circle_id: string;
  user_id: string;
  content: string;
  is_prompt_response: boolean;
  parent_id: string | null;
  is_removed: boolean;
  created_at: string;
  users: { username: string } | null;
};

export type ReactionRow = {
  post_id: string;
  user_id: string;
  type: ReactionType;
};
