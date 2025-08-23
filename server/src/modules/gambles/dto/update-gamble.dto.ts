import { PartialType } from '@nestjs/swagger';
import { CreateGambleDto } from './create-gamble.dto';

export class UpdateGambleDto extends PartialType(CreateGambleDto) {}
