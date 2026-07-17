"use client";

/**
 * 렌더 트리에서 던져진 오류를 잡아 fallback을 그리는 경량 에러 바운더리.
 * (react-error-boundary 미설치 — 필요한 최소 기능만 자체 구현.)
 *
 * - `fallback`: 오류·재시도 핸들러를 받아 대체 UI를 렌더.
 * - `resetKeys`: 값이 바뀌면 자동으로 오류 상태를 해제(예: 라우트 param 변경).
 * - `onReset`: 재시도 시 호출(React Query의 reset 등과 연결).
 */

import { Component, type ReactNode } from "react";

export interface ErrorBoundaryFallbackProps {
  error: Error;
  reset: () => void;
}

interface ErrorBoundaryProps {
  fallback: (props: ErrorBoundaryFallbackProps) => ReactNode;
  onReset?: () => void;
  resetKeys?: readonly unknown[];
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function keysChanged(
  a: readonly unknown[] = [],
  b: readonly unknown[] = [],
): boolean {
  return a.length !== b.length || a.some((value, index) => value !== b[index]);
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error &&
      keysChanged(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error) {
      return this.props.fallback({ error, reset: this.reset });
    }
    return this.props.children;
  }
}
