import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RenameGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;
}
