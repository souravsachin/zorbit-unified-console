import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertPreferencesDto {
  @ApiProperty({
    description: 'User preferences object. Top-level keys are namespaces (ui, locale, a11y, notify, modules).',
    example: {
      ui: { sidebar: { mode: 'normal', pinned: true, collapsedSections: [] }, theme: 'light' },
      locale: { languages: ['en'] },
    },
  })
  @IsObject()
  @IsNotEmpty()
  preferences!: Record<string, unknown>;
}
