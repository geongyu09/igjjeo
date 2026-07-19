"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Toast.module.css";

interface ToastItem {
  id: number;
  message: string;
}

interface ToastContextValue {
  /** 화면 하단에 잠깐 떠올랐다 사라지는 알림을 띄운다. */
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** 토스트가 자동으로 사라지기까지의 시간(ms). */
const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string) => {
    const id = (idRef.current += 1);
    setToasts((prev) => [...prev, { id, message }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast는 ToastProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  // 서버 렌더 시 document가 없으므로 마운트 후에만 포탈을 연다.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className={styles.viewport} role="region" aria-label="알림">
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

interface ToastRowProps {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}

function ToastRow({ toast, onDismiss }: ToastRowProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}
