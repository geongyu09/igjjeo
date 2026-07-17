/**
 * 업로드 데이터 접근 계층 (reports-adaptation.md `POST /uploads`).
 * 제보 사진·아바타 바이너리를 오브젝트 스토리지에 올리고 public URL을 받는다.
 * 프로토타입: 웹 파일 입력(multipart) 기반 직접 업로드.
 */

import { apiClient } from "@/lib/api/client";
import type { Upload } from "@/lib/api/types";

export interface UploadFileParams {
  file: File | Blob;
  purpose?: "report_photo" | "avatar";
}

export async function uploadFile({
  file,
  purpose,
}: UploadFileParams): Promise<Upload> {
  const form = new FormData();
  form.append("file", file);
  if (purpose) form.append("purpose", purpose);

  const { data } = await apiClient.post<Upload>("/uploads", form, {
    // 브라우저가 multipart 경계(boundary)를 직접 채우도록 Content-Type을 비운다.
    headers: { "Content-Type": undefined },
  });
  return data;
}
