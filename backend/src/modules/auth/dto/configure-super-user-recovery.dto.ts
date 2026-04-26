import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ConfigureSuperUserRecoveryDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 160)
  questionOne: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  answerOne: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 160)
  questionTwo: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 120)
  answerTwo: string;

  @IsString()
  @IsNotEmpty()
  @Length(24, 128)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'recoveryKey must include uppercase, lowercase, number, and special character',
  })
  recoveryKey: string;
}
