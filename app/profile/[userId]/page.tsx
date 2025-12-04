"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { User, Post } from "@/lib/types";
import { UserAvatar } from "@/components/UserAvatar";

type ProfileResponse = {
  user: User;
  followers: User[];
  following: User[];
  posts: Post[];
  isFollowing: boolean;
  isOwnProfile: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "followers" | "following">("posts");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        
        // Get current user
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        }

        // Get profile data
        const res = await fetch(`/api/profile/${userId}`, { credentials: "include" });
        if (!res.ok) {
          router.push("/");
          return;
        }
        
        const data = await res.json() as ProfileResponse;
        setProfile(data);
        setProfilePictureUrl(data.user.profilePicture || "");
        setName(data.user.name);
      } catch (error) {
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (userId) {
      void loadProfile();
    }
  }, [userId, router]);

  async function handleToggleFollow() {
    if (!currentUser || !profile) return;
    
    await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ followingId: userId })
    });
    
    // Reload profile to update follow status
    const res = await fetch(`/api/profile/${userId}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json() as ProfileResponse;
      setProfile(data);
    }
  }

  async function handleUpdateProfile() {
    if (!currentUser || !profile?.isOwnProfile) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/profile/${userId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profilePicture: profilePictureUrl || undefined,
          name: name.trim()
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => prev ? { ...prev, user: data.user } : null);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-brand-500"></div>
          <p className="text-sm text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const { user, followers, following, posts, isFollowing, isOwnProfile } = profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="text-slate-400 hover:text-slate-200 transition"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              Profile
            </h1>
            <div className="w-6"></div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <div className="glass rounded-2xl border border-slate-800/50 p-8 shadow-xl mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.name}
                  className="h-24 w-24 rounded-full object-cover border-4 border-slate-800"
                />
              ) : (
                <UserAvatar user={user} size="xl" />
              )}
              {isOwnProfile && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center transition"
                  title="Edit profile"
                >
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-50 mb-1">{user.name}</h2>
              <p className="text-slate-400 mb-4">@{user.handle}</p>
              
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <span className="text-slate-50 font-semibold">{posts.length}</span>
                  <span className="text-slate-400 ml-1">posts</span>
                </div>
                <button
                  onClick={() => setActiveTab("followers")}
                  className="hover:text-brand-400 transition"
                >
                  <span className="text-slate-50 font-semibold">{followers.length}</span>
                  <span className="text-slate-400 ml-1">followers</span>
                </button>
                <button
                  onClick={() => setActiveTab("following")}
                  className="hover:text-brand-400 transition"
                >
                  <span className="text-slate-50 font-semibold">{following.length}</span>
                  <span className="text-slate-400 ml-1">following</span>
                </button>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={handleToggleFollow}
                  className={`px-6 py-2 rounded-xl font-semibold transition-all ${
                    isFollowing
                      ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                      : "bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-400 hover:to-brand-500"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "posts"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("followers")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "followers"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "following"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Following ({following.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === "posts" && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="glass rounded-2xl border border-slate-800/50 p-12 text-center">
                <p className="text-slate-400">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="glass rounded-2xl border border-slate-800/50 p-6">
                  <p className="text-slate-100 whitespace-pre-wrap mb-4">{post.content}</p>
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt=""
                      className="w-full rounded-xl mb-4"
                    />
                  )}
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>❤️ {post.likeUserIds.length}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "followers" && (
          <div className="glass rounded-2xl border border-slate-800/50 p-6">
            <h3 className="text-lg font-bold text-slate-50 mb-4">Followers</h3>
            {followers.length === 0 ? (
              <p className="text-slate-400">No followers yet</p>
            ) : (
              <div className="space-y-3">
                {followers.map((follower) => (
                  <div
                    key={follower.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition cursor-pointer"
                    onClick={() => router.push(`/profile/${follower.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={follower} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{follower.name}</p>
                        <p className="text-xs text-slate-400">@{follower.handle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "following" && (
          <div className="glass rounded-2xl border border-slate-800/50 p-6">
            <h3 className="text-lg font-bold text-slate-50 mb-4">Following</h3>
            {following.length === 0 ? (
              <p className="text-slate-400">Not following anyone yet</p>
            ) : (
              <div className="space-y-3">
                {following.map((followed) => (
                  <div
                    key={followed.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition cursor-pointer"
                    onClick={() => router.push(`/profile/${followed.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={followed} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{followed.name}</p>
                        <p className="text-xs text-slate-400">@{followed.handle}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl border border-slate-800/50 p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-50 mb-4">Edit Profile</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Profile Picture URL</label>
                <input
                  type="text"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Enter a URL to an image</p>
              </div>
              
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-400 hover:to-brand-500 disabled:opacity-50 transition"
              >
                {isUpdating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




