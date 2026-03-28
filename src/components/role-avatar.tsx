"use client";

/**
 * RoleAvatar — single component used in both the sidebar footer and
 * Settings → Profile header. Three modes:
 *
 *   initials  → solid role-color background, white text  (default)
 *   emoji     → neutral bg + colored ring + glow shadow
 *   photo     → circular image    + colored ring + glow shadow
 *
 * Role → color mapping lives in src/lib/roles.ts (ROLE_AVATAR_BG, ROLE_RING, ROLE_GLOW).
 */

import { type AppRole, ROLE_AVATAR_BG, ROLE_RING, ROLE_GLOW } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/auth-context";

type AvatarSize = "sm" | "md" | "lg";

const sizeClass: Record<AvatarSize, string> = {
  sm:  "h-8 w-8 text-xs",
  md:  "h-14 w-14 text-xl",
  lg:  "h-20 w-20 text-2xl",
};

interface RoleAvatarProps {
  user: Pick<User, "avatar" | "role" | "avatarType" | "avatarPhoto">;
  size?: AvatarSize;
  className?: string;
  href?: string;
  onClick?: () => void;
  title?: string;
}

export function RoleAvatar({
  user,
  size = "sm",
  className,
  href,
  onClick,
  title,
}: RoleAvatarProps) {
  const role = (user.role ?? "User") as AppRole;
  const type = user.avatarType ?? "initials";

  const base = cn(
    "rounded-full flex items-center justify-center shrink-0 font-semibold overflow-hidden transition-opacity hover:opacity-85",
    sizeClass[size],
    className
  );

  let inner: React.ReactNode;
  let style: React.CSSProperties = {};

  if (type === "photo" && user.avatarPhoto) {
    // Photo: circular image + glow ring
    inner = (
      <img
        src={user.avatarPhoto}
        alt="avatar"
        className="h-full w-full object-cover rounded-full"
      />
    );
    style = {
      boxShadow: `0 0 0 2.5px ${ROLE_GLOW[role]}, 0 0 10px 2px ${ROLE_GLOW[role]}`,
    };
  } else if (type === "emoji" && user.avatar) {
    // Emoji: single char on subtle bg + glow ring
    inner = (
      <span className="select-none leading-none" style={{ fontSize: size === "lg" ? "2rem" : size === "md" ? "1.4rem" : "1rem" }}>
        {user.avatar}
      </span>
    );
    style = {
      boxShadow: `0 0 0 2.5px ${ROLE_GLOW[role]}, 0 0 10px 2px ${ROLE_GLOW[role]}`,
    };
  } else {
    // Initials (default): solid role-colored background
    inner = user.avatar || "?";
  }

  const classNames = cn(
    base,
    type === "initials"
      ? ROLE_AVATAR_BG[role]
      : cn("bg-muted/70 ring-2", ROLE_RING[role])
  );

  if (href) {
    return (
      <a href={href} onClick={onClick} title={title} className={classNames} style={style}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} title={title} className={classNames} style={style}>
      {inner}
    </button>
  );
}
