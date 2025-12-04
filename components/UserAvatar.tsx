import type { User } from "@/lib/types";

export function UserAvatar({
  user,
  size = "sm"
}: {
  user: User;
  size?: "sm" | "md" | "xl";
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    xl: "h-24 w-24 text-2xl"
  };

  const base = sizeClasses[size];

  // If user has a profile picture, use it
  if (user.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt={user.name}
        className={`${base} rounded-full object-cover`}
      />
    );
  }

  // Otherwise, use the colored avatar with initials
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-slate-950 shadow-soft ${base}`}
      style={{ background: user.avatarColor }}
    >
      <span>
        {user.name
          .split(" ")
          .map((p) => p[0])
          .join("")}
      </span>
    </div>
  );
}


