import type { Comment, Follow, Notification, Post, User } from "./types";
import {
  getUsers as getStoredUsers,
  getUserById as getStoredUserById
} from "./authStore";
import { readAppData, writeAppData, type AppData } from "./dataStore";

function getData(): AppData {
  return readAppData();
}

function saveData(data: AppData) {
  writeAppData(data);
}

function generateId(data: AppData): string {
  data.idCounter += 1;
  return `${data.idCounter}`;
}

export function getFeedForUser(userId: string): {
  posts: Post[];
  comments: Comment[];
} {
  const data = getData();
  const followingIds = data.follows
    .filter((f) => f.followerId === userId)
    .map((f) => f.followingId)
    .concat(userId);

  const feedPosts = data.posts
    .filter((p) => followingIds.includes(p.authorId))
    .sort((a, b) => b.createdAt - a.createdAt);

  const relatedComments = data.comments.filter((c) =>
    feedPosts.some((p) => p.id === c.postId)
  );

  return { posts: feedPosts, comments: relatedComments };
}

export function getUsers(): User[] {
  return getStoredUsers();
}

export function getUserById(id: string): User | null {
  return getStoredUserById(id);
}

export function createPost(
  authorId: string,
  content: string,
  options?: { mediaUrl?: string; mediaType?: "image" | "video" }
) {
  const data = getData();
  const mediaUrl = options?.mediaUrl?.trim() || undefined;
  const mediaType = options?.mediaType;
  const post: Post = {
    id: `p${generateId(data)}`,
    authorId,
    content,
    imageUrl: mediaType === "image" ? mediaUrl : undefined,
    mediaUrl,
    mediaType,
    createdAt: Date.now(),
    likeUserIds: []
  };
  data.posts.unshift(post);

  // Notify followers
  const followerIds = data.follows
    .filter((f) => f.followingId === authorId)
    .map((f) => f.followerId);

  for (const followerId of followerIds) {
    data.notifications.unshift({
      id: `n${generateId(data)}`,
      userId: followerId,
      actorId: authorId,
      type: "post",
      postId: post.id,
      createdAt: Date.now(),
      read: false
    });
  }

  saveData(data);
  return post;
}

export function toggleLike(postId: string, userId: string) {
  const data = getData();
  const post = data.posts.find((p) => p.id === postId);
  if (!post) return null;

  const already = post.likeUserIds.includes(userId);
  post.likeUserIds = already
    ? post.likeUserIds.filter((id) => id !== userId)
    : [...post.likeUserIds, userId];

  if (!already && post.authorId !== userId) {
    data.notifications.unshift({
      id: `n${generateId(data)}`,
      userId: post.authorId,
      actorId: userId,
      type: "like",
      postId,
      createdAt: Date.now(),
      read: false
    });
  }

  saveData(data);
  return post;
}

export function addComment(postId: string, userId: string, content: string) {
  const data = getData();
  const comment: Comment = {
    id: `c${generateId(data)}`,
    postId,
    authorId: userId,
    content,
    createdAt: Date.now()
  };
  data.comments.push(comment);

  const post = data.posts.find((p) => p.id === postId);
  if (post && post.authorId !== userId) {
    data.notifications.unshift({
      id: `n${generateId(data)}`,
      userId: post.authorId,
      actorId: userId,
      type: "comment",
      postId,
      createdAt: Date.now(),
      read: false
    });
  }

  saveData(data);
  return comment;
}

export function getCommentsForPost(postId: string) {
  return getData()
    .comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function isFollowing(followerId: string, followingId: string) {
  const data = getData();
  return data.follows.some(
    (f) => f.followerId === followerId && f.followingId === followingId
  );
}

export function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) return;
  const data = getData();
  const existingIndex = data.follows.findIndex(
    (f) => f.followerId === followerId && f.followingId === followingId
  );
  if (existingIndex >= 0) {
    data.follows.splice(existingIndex, 1);
  } else {
    data.follows.push({ followerId, followingId });
    data.notifications.unshift({
      id: `n${generateId(data)}`,
      userId: followingId,
      actorId: followerId,
      type: "follow",
      createdAt: Date.now(),
      read: false
    });
  }
  saveData(data);
}

export function getSuggestionsForUser(userId: string) {
  const users = getStoredUsers();
  const data = getData();
  return users.filter(
    (u) =>
      u.id !== userId &&
      !data.follows.some(
        (f) => f.followerId === userId && f.followingId === u.id
      )
  );
}

export function getNotificationsForUser(userId: string) {
  const data = getData();
  return data.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function markAllNotificationsRead(userId: string) {
  const data = getData();
  data.notifications.forEach((n) => {
    if (n.userId === userId) n.read = true;
  });
  saveData(data);
}

export function getFollowers(userId: string): User[] {
  const data = getData();
  const followerIds = data.follows
    .filter((f) => f.followingId === userId)
    .map((f) => f.followerId);
  
  return getStoredUsers().filter((u) => followerIds.includes(u.id));
}

export function getFollowing(userId: string): User[] {
  const data = getData();
  const followingIds = data.follows
    .filter((f) => f.followerId === userId)
    .map((f) => f.followingId);
  
  return getStoredUsers().filter((u) => followingIds.includes(u.id));
}

export function getFollowingIds(userId: string): string[] {
  const data = getData();
  return data.follows
    .filter((f) => f.followerId === userId)
    .map((f) => f.followingId);
}

export function getPostsByUser(userId: string): Post[] {
  return getData()
    .posts
    .filter((p) => p.authorId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}


