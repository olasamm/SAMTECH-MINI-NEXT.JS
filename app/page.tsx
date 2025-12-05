"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { Comment, Notification, Post, User } from "@/lib/types";
import { UserAvatar } from "@/components/UserAvatar";

type FeedResponse = {
  posts: Post[];
  comments: Comment[];
  users: User[];
  me: User;
  followingUserIds: string[];
};

type NotificationsResponse = {
  notifications: Notification[];
  users: User[];
};

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);
  const [mediaAttachment, setMediaAttachment] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const suggestions = useMemo(
    () =>
      (users ?? []).filter(
        (u) => me && u.id !== me.id && !followingUserIds.includes(u.id)
      ),
    [users, me, followingUserIds]
  );

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  async function loadFeed() {
    try {
      const res = await fetch(`/api/feed`, {
        credentials: "include"
      });
      
      if (!res.ok) {
        // If not authenticated, redirect to login
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        return;
      }
      
      const data = (await res.json()) as FeedResponse;
      setMe(data.me);
      setUsers(data.users ?? []);
      setPosts(data.posts ?? []);
      setComments(data.comments ?? []);
      setFollowingUserIds(data.followingUserIds ?? []);
    } catch (error) {
      console.error("Error loading feed:", error);
    }
  }

  async function loadNotifications() {
    try {
      const res = await fetch(`/api/notifications`, {
        credentials: "include"
      });
      
      if (!res.ok) {
        // If not authenticated, don't show error for notifications
        if (res.status === 401) {
          return;
        }
        return;
      }
      
      const data = (await res.json()) as NotificationsResponse;
      setNotifications(data.notifications ?? []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const meRes = await fetch("/api/auth/me", {
          credentials: "include"
        });
        
        // If the request failed (not ok) or user is not authenticated (401), redirect to login
        if (!meRes.ok) {
          // 401 is expected when not logged in - silently redirect
          router.replace("/login");
          return;
        }
        
        // Parse the response to get user data
        const meData = await meRes.json();
        
        // If no user data, redirect to login
        if (!meData.user) {
          router.replace("/login");
          return;
        }
        
        // User is authenticated - set user and load data
        setMe(meData.user);
        await Promise.all([loadFeed(), loadNotifications()]);
      } catch (error) {
        // Silently redirect on any error - user will be handled by login page
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    }
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePostSubmit() {
    if (!content.trim() || !me || isUploadingMedia) return;
    setIsPosting(true);
    try {
      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content,
          mediaUrl: mediaAttachment?.url,
          mediaType: mediaAttachment?.type
        })
      });
      setContent("");
      setMediaAttachment(null);
      setMediaError(null);
      await Promise.all([
        loadFeed(),
        loadNotifications()
      ]);
    } finally {
      setIsPosting(false);
    }
  }

  async function handleMediaUpload(file: File | null) {
    if (!file) return;
    setMediaError(null);
    const isVideo = file.type.startsWith("video");
    const maxSizeMb = isVideo ? 40 : 12;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setMediaError(`Please choose a ${isVideo ? "video" : "photo"} under ${maxSizeMb}MB.`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsUploadingMedia(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Upload failed");
      }
      const data = await res.json();
      setMediaAttachment({
        url: data.url,
        type: data.resourceType === "video" ? "video" : "image"
      });
    } catch (error) {
      console.error("Upload error", error);
      setMediaAttachment(null);
      setMediaError(
        error instanceof Error ? error.message : "Upload failed. Please try again."
      );
    } finally {
      setIsUploadingMedia(false);
    }
  }

  function handleMediaInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    void handleMediaUpload(file ?? null);
    event.target.value = "";
  }

  async function handleToggleLike(postId: string) {
    if (!me) return;
    await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId })
    });
    await Promise.all([
      loadFeed(),
      loadNotifications()
    ]);
  }

  async function handleAddComment(postId: string, text: string) {
    if (!me || !text.trim()) return;
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        postId,
        content: text
      })
    });
    await Promise.all([
      loadFeed(),
      loadNotifications()
    ]);
  }

  async function handleToggleFollow(targetId: string) {
    if (!me) return;
    await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        followingId: targetId
      })
    });
    await Promise.all([
      loadFeed(),
      loadNotifications()
    ]);
  }

  async function handleOpenNotifications() {
    setIsNotifOpen((prev) => !prev);
    if (!me) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "markRead" })
    });
    await loadNotifications();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { 
      method: "POST",
      credentials: "include"
    });
    router.push("/login");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-brand-500"></div>
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
                Social
              </h1>
              {me && (
                <button
                  onClick={() => router.push(`/profile/${me.id}`)}
                  className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-800 hover:opacity-80 transition"
                >
                  <UserAvatar user={me} size="md" />
                  <div>
                    <p className="text-sm font-semibold text-slate-50">
                      {me.name}
                    </p>
                    <p className="text-xs text-slate-400">@{me.handle}</p>
                  </div>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenNotifications}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-200 transition-all hover:bg-slate-800 hover:border-brand-500/50 hover:scale-105"
                title="Notifications"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-1 text-[10px] font-bold text-white shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-300 rounded-xl border border-slate-700/50 bg-slate-800/50 transition-all hover:bg-slate-700 hover:border-slate-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
          <section className="space-y-6">
            {/* Create Post Card */}
            <div className="glass rounded-2xl border border-slate-800/50 p-6 shadow-xl">
              <div className="flex items-start gap-4 mb-4">
                {me && <UserAvatar user={me} size="md" />}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-50 mb-1">
                    What's on your mind?
                  </p>
                  <p className="text-xs text-slate-400">Share your thoughts with the community</p>
                </div>
              </div>

              <textarea
                rows={4}
                placeholder="Share something amazing with your community..."
                className="w-full resize-none rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 240))}
              />
              {(mediaAttachment || isUploadingMedia) && (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40">
                  {isUploadingMedia ? (
                    <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                      Uploading media...
                    </div>
                  ) : mediaAttachment?.type === "video" ? (
                    <video
                      src={mediaAttachment.url}
                      controls
                      className="max-h-80 w-full rounded-xl border-none object-cover"
                    />
                  ) : (
                    <img
                      src={mediaAttachment?.url}
                      alt="Selected media"
                      className="w-full object-cover"
                    />
                  )}
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700/60 px-4 py-2 text-slate-300 transition hover:border-brand-500/50 hover:text-brand-300">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleMediaInputChange}
                  />
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add photo / video
                </label>
                {mediaAttachment && (
                  <button
                    type="button"
                    onClick={() => {
                      setMediaAttachment(null);
                      setMediaError(null);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-800/60 px-3 py-1.5 text-slate-400 hover:text-rose-400"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Remove media
                  </button>
                )}
                {mediaError && (
                  <span className="text-rose-400">
                    {mediaError}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {240 - content.length} characters remaining
                </span>
                <button
                  className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/40 hover:scale-105"
                  disabled={!content.trim() || isPosting || !me || isUploadingMedia}
                  onClick={handlePostSubmit}
                >
                  {isPosting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Posting...
                    </span>
                  ) : isUploadingMedia ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Waiting for media...
                    </span>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </div>

            {isNotifOpen && (
              <NotificationsPanel
                notifications={notifications}
                users={users}
                onClose={() => setIsNotifOpen(false)}
              />
            )}

            {/* Feed Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-50">Your Feed</h2>
              <p className="text-xs text-slate-500">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} · {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </p>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  users={users}
                  comments={comments.filter((c) => c.postId === post.id)}
                  activeUserId={me?.id ?? ""}
                  onToggleLike={() => handleToggleLike(post.id)}
                  onAddComment={(text) => handleAddComment(post.id, text)}
                />
              ))}
              {posts.length === 0 && (
                <div className="glass rounded-2xl border border-slate-800/50 p-12 text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-600/20 flex items-center justify-center">
                    <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-slate-300 mb-1">Your feed is empty</p>
                  <p className="text-sm text-slate-500">Be the first to share something amazing!</p>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            {/* Suggested Creators */}
            <section className="glass rounded-2xl border border-slate-800/50 p-6 shadow-xl">
              <h3 className="mb-4 text-base font-bold text-slate-50">
                Suggested Creators
              </h3>
              <div className="space-y-3">
                {suggestions.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 rounded-xl p-3 hover:bg-slate-800/50 transition"
                  >
                    <button
                      onClick={() => router.push(`/profile/${user.id}`)}
                      className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition"
                    >
                      <UserAvatar user={user} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500">@{user.handle}</p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFollow(user.id);
                      }}
                      className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 transition-all hover:scale-105"
                    >
                      Follow
                    </button>
                  </div>
                ))}
                {suggestions.length === 0 && (
                  <p className="text-sm text-center text-slate-500 py-4">
                    You&apos;re connected with everyone! 🎉
                  </p>
                )}
              </div>
            </section>

            {/* Info Card */}
            <section className="glass rounded-2xl border border-slate-800/50 p-6 shadow-xl bg-gradient-to-br from-brand-500/10 to-brand-600/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-50">About</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                SAMTECH MINI is a compact social hub where you can connect with fellow creators, share what matters, and discover fresh perspectives every day.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function PostCard(props: {
  post: Post;
  users: User[];
  comments: Comment[];
  activeUserId: string;
  onToggleLike: () => void;
  onAddComment: (text: string) => void;
}) {
  const { post, users, comments, activeUserId, onToggleLike, onAddComment } =
    props;
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const author = users.find((u) => u.id === post.authorId);
  const youLike = post.likeUserIds.includes(activeUserId);
  const mediaUrl = post.mediaUrl ?? post.imageUrl;
  const mediaType = post.mediaType ?? (post.imageUrl ? "image" : undefined);

  const createdAgo = timeAgo(post.createdAt);

  return (
    <article className="glass rounded-2xl border border-slate-800/50 p-6 shadow-xl hover:shadow-2xl transition-all hover:border-slate-700/50">
      <div className="flex items-start gap-3">
        {author && (
          <button
            onClick={() => router.push(`/profile/${author.id}`)}
            className="cursor-pointer hover:opacity-80 transition"
          >
            <UserAvatar user={author} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => author && router.push(`/profile/${author.id}`)}
              className="text-sm font-bold text-slate-50 hover:text-brand-400 transition cursor-pointer"
            >
              {author?.name}
            </button>
            <button
              onClick={() => author && router.push(`/profile/${author.id}`)}
              className="text-xs text-slate-500 hover:text-brand-400 transition cursor-pointer"
            >
              @{author?.handle}
            </button>
            <span className="text-slate-600">·</span>
            <p className="text-xs text-slate-500">
              {createdAgo}
            </p>
          </div>
          <p className="mt-3 text-base text-slate-100 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
          {mediaUrl && (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800/50">
              {mediaType === "video" ? (
                <video src={mediaUrl} controls className="w-full rounded-xl">
                  Sorry, your browser doesn&apos;t support embedded videos.
                </video>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
              <img
                  src={mediaUrl}
                alt=""
                className="w-full object-cover"
              />
              )}
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
            <button
              onClick={onToggleLike}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:bg-slate-800/50 hover:scale-105"
            >
              <svg className={`h-5 w-5 ${youLike ? "text-rose-500 fill-rose-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className={youLike ? "text-rose-500 font-semibold" : "text-slate-400"}>
                {post.likeUserIds.length}
              </span>
              {youLike && <span className="text-xs text-rose-500">· You</span>}
            </button>
            <span className="text-slate-500">{comments.length} {comments.length === 1 ? 'reply' : 'replies'}</span>
          </div>
          <div className="mt-4 space-y-3 border-t border-slate-800/50 pt-4">
            {comments.map((c) => {
              const u = users.find((x) => x.id === c.authorId);
              return (
                <div key={c.id} className="flex gap-2">
                  {u && (
                    <div className="mt-[2px]">
                      <UserAvatar user={u} size="sm" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 rounded-xl bg-slate-800/50 px-4 py-3 border border-slate-700/30">
                    <p className="text-[11px] font-medium text-slate-200">
                      {u?.name} ·{" "}
                      <span className="text-slate-500">
                        {timeAgo(c.createdAt)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-100">
                      {c.content}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-2 pt-2">
              <input
                className="h-10 flex-1 rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
                placeholder="Write a reply..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value.slice(0, 160))}
              />
              <button
                className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                disabled={!commentText.trim()}
                onClick={() => {
                  if (!commentText.trim()) return;
                  onAddComment(commentText.trim());
                  setCommentText("");
                }}
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function NotificationsPanel({
  notifications,
  users,
  onClose
}: {
  notifications: Notification[];
  users: User[];
  onClose: () => void;
}) {
  return (
    <div className="glass rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/10 to-brand-600/5 p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-base font-bold text-slate-50">
            Notifications
          </p>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto pr-2">
        {notifications.map((n) => {
          const actor = users.find((u) => u.id === n.actorId);
          let label = "";
          let icon = "";
          if (n.type === "like") {
            label = "liked your post";
            icon = "❤️";
          }
          if (n.type === "comment") {
            label = "replied to your post";
            icon = "💬";
          }
          if (n.type === "follow") {
            label = "started following you";
            icon = "👤";
          }
          if (n.type === "post") {
            label = "published a new post";
            icon = "📝";
          }

          return (
            <div
              key={n.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                n.read
                  ? "border-slate-800/50 bg-slate-800/30"
                  : "border-brand-500/40 bg-gradient-to-r from-brand-500/10 to-brand-600/5"
              }`}
            >
              {actor && (
                <UserAvatar user={actor} size="md" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-100">
                  <span className="font-semibold">{actor?.name}</span>{" "}
                  <span className="text-slate-300">{label}</span>
                  <span className="ml-2">{icon}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {timeAgo(n.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-slate-800/50 flex items-center justify-center">
              <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">
              You&apos;re all caught up!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}


