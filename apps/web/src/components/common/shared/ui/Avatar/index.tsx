import { User } from "lucide-react";
import styles from "./Avatar.module.css";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  /** 표시할 이름 — 첫 글자만 보여준다. 없으면 플레이스홀더 */
  name?: string;
  size?: AvatarSize;
  /** 강조 (action 배경) */
  emphasized?: boolean;
  className?: string;
}

const ICON_SIZE: Record<AvatarSize, number> = { sm: 13, md: 16, lg: 20 };

export function Avatar({
  name,
  size = "md",
  emphasized = false,
  className,
}: AvatarProps) {
  const initial = name?.trim().charAt(0);

  return (
    <span
      className={[styles.avatar, className].filter(Boolean).join(" ")}
      data-size={size}
      data-emphasized={emphasized ? "" : undefined}
      data-placeholder={initial ? undefined : ""}
      aria-hidden={initial ? undefined : true}
    >
      {initial ?? <User size={ICON_SIZE[size]} />}
    </span>
  );
}
