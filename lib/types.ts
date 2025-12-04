export type User = {
  id: string;
  handle: string;
  name: string;
  avatarColor: string;
  profilePicture?: string;
};

export type Post = {
  id: string;
  authorId: string;
  createdAt: number;
  content: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  likeUserIds: string[];
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  createdAt: number;
  content: string;
};

export type Follow = {
  followerId: string;
  followingId: string;
};

export type NotificationType = "like" | "comment" | "follow" | "post";

export type Notification = {
  id: string;
  userId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  createdAt: number;
  read: boolean;
};


