import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * PATCH /groups/:groupId 요청 — 방 이름·각색 키워드를 부분 갱신한다(owner).
 * 두 필드 모두 선택이며, 온 필드만 반영한다. `keyword` 는 빈 문자열("")로 보내면
 * 키워드 제거를 뜻하므로 비어 있어도 허용한다(최대 100자).
 */
export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;
}
