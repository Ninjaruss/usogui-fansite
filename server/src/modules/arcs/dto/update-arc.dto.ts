import { PartialType } from '@nestjs/swagger';
import { CreateArcDto } from './create-arc.dto';

export class UpdateArcDto extends PartialType(CreateArcDto) {}
