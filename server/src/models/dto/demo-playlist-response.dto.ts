import { PlaylistEntry } from '../entities/demo-playlist.entity';

export interface DemoPlaylistResponseDto {
  id: string;
  title: string;
  description: string | null;
  segments: PlaylistEntry[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
