import { PartialType } from '@nestjs/swagger';
import { CreateChapterSpoilerDto } from './create-chapter-spoiler.dto';

export class UpdateChapterSpoilerDto extends PartialType(CreateChapterSpoilerDto) {}
