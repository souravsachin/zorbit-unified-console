import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from '../models/entities/user-preference.entity';

@Injectable()
export class PreferencesService {
  private readonly logger = new Logger(PreferencesService.name);

  constructor(
    @InjectRepository(UserPreference)
    private readonly repo: Repository<UserPreference>,
  ) {}

  /**
   * Get preferences for a user. Returns empty object if none saved.
   */
  async get(userId: string): Promise<Record<string, unknown>> {
    const row = await this.repo.findOne({ where: { userId } });
    return row?.preferences ?? {};
  }

  /**
   * Upsert (insert or replace) preferences for a user.
   * The entire preferences object is replaced — the frontend owns the merge logic.
   */
  async upsert(
    userId: string,
    orgId: string,
    preferences: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const existing = await this.repo.findOne({ where: { userId } });

    if (existing) {
      existing.orgId = orgId;
      existing.preferences = preferences;
      await this.repo.save(existing);
      this.logger.debug(`Updated preferences for ${userId}`);
    } else {
      const row = this.repo.create({ userId, orgId, preferences });
      await this.repo.save(row);
      this.logger.debug(`Created preferences for ${userId}`);
    }

    return preferences;
  }
}
