"use client";

import {
  CircleCheck,
  CircleHelp,
  Newspaper,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  REACTION_LABELS,
  REACTION_TYPES,
  type ReactionType,
} from "@/lib/reactions";
import styles from "./ReactionBar.module.css";

const REACTION_ICONS: Record<ReactionType, LucideIcon> = {
  really: CircleHelp,
  shock: Zap,
  admit: CircleCheck,
  scoop: Newspaper,
};

export interface ReactionBarProps {
  counts: Record<ReactionType, number>;
  /** 내가 누른 반응 */
  myReaction?: ReactionType | null;
  onReact?: (type: ReactionType) => void;
  className?: string;
}

export function ReactionBar({
  counts,
  myReaction = null,
  onReact,
  className,
}: ReactionBarProps) {
  return (
    <div className={[styles.reactionBar, className].filter(Boolean).join(" ")}>
      {REACTION_TYPES.map((type) => {
        const Icon = REACTION_ICONS[type];
        const pressed = type === myReaction;
        return (
          <button
            key={type}
            type="button"
            aria-pressed={pressed}
            className={styles.reaction}
            data-reaction={type}
            onClick={() => onReact?.(type)}
          >
            <Icon size={16} aria-hidden />
            {REACTION_LABELS[type]}{" "}
            <span className={styles.count}>{counts[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
