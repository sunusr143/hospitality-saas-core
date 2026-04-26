import { IsEmail, IsNotEmpty } from 'class-validator';

export class GetSuperUserRecoveryQuestionsDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
