import { useMutation } from "@tanstack/react-query";
import { uploadFile, type UploadFileParams } from "@/lib/data/uploads";

/** 파일 업로드 (POST /uploads). 반환된 URL을 제보 photo_url·아바타로 사용. */
export function useUploadMutation() {
  return useMutation({
    mutationFn: (params: UploadFileParams) => uploadFile(params),
  });
}
