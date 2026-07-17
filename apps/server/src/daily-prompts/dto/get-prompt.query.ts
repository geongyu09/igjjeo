import { IsOptional, Matches } from "class-validator";

export class GetPromptQuery {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "date 는 YYYY-MM-DD 형식이어야 합니다",
  })
  date?: string;
}
