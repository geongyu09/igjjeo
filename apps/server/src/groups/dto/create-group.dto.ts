import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  /** 방 각색 키워드(선택). 이 방의 뉴스 각색 프롬프트에 참고 맥락으로 들어간다. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;
}
