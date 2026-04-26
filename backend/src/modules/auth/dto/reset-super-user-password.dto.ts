import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ResetSuperUserPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  answerOne: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  answerTwo: string;

  @IsString()
  @IsNotEmpty()
  @Length(24, 128)
  recoveryKey: string;

  @IsString()
  @IsNotEmpty()
  @Length(12, 128)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'newPassword must include uppercase, lowercase, number, and special character',
  })
  newPassword: string;
}
