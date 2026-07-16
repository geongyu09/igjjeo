import type { Metadata } from "next";
import { StackLinkProvider } from "stack-link";
import "./globals.css";

export const metadata: Metadata = {
  title: "이거 진짜에요?",
  description: "소모임 안의 사소한 일을 AI가 언론사 시각으로 각색해 방 안에만 발행하는 뉴스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body>
        <StackLinkProvider>{children}</StackLinkProvider>
      </body>
    </html>
  );
}
