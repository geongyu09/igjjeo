import { Check } from "lucide-react";
import { OUTLET_KEYS, PUBLISHERS, type OutletKey } from "@/lib/publishers";
import styles from "./AssignedOutletList.module.css";

export interface AssignedOutletListProps {
  /** 이번 제보에 배정된 언론사 */
  assigned: OutletKey[];
  /** 전체 후보 (기본 5곳 전부) */
  outlets?: readonly OutletKey[];
  className?: string;
}

/** 무작위 3곳 배정 결과 목록 (02 제보하기) */
export function AssignedOutletList({
  assigned,
  outlets = OUTLET_KEYS,
  className,
}: AssignedOutletListProps) {
  const assignedSet = new Set(assigned);
  return (
    <ul className={[styles.list, className].filter(Boolean).join(" ")}>
      {outlets.map((outlet) => {
        const isAssigned = assignedSet.has(outlet);
        const publisher = PUBLISHERS[outlet];
        return (
          <li
            key={outlet}
            className={styles.row}
            data-outlet={outlet}
            data-assigned={isAssigned ? "" : undefined}
          >
            <div className={styles.info}>
              <span className={styles.name}>{publisher.name}</span>
              <span className={styles.tagline}>{publisher.tagline}</span>
            </div>
            {isAssigned && (
              <span className={styles.assigned}>
                <Check size={14} aria-hidden />
                배정됨
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
