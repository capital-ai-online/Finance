// ADR-0020 — Persistiertes Publish-Log (ersetzt das In-Memory-Array des Handover-Prototyps).

import { getServerSupabase, isSupabaseConfigured } from '../db';
import { createLogger } from '../logger';
import type { PublishLogEntry, SupportedAccountPlatform, PublishExecutionType } from '../../src/platform/SocialMediaEngine/types';

const logger = createLogger('social-media:publishLog');

export interface PublishLogInsert {
  userId: string;
  episodeId: string;
  episodeTitle: string;
  platform: SupportedAccountPlatform;
  accountId: string | null;
  accountHandle: string;
  status: PublishLogEntry['status'];
  publishType: PublishExecutionType;
  publishedUrl?: string;
  scheduledAt?: string;
  errorMessage?: string;
}

export async function recordPublishLog(entry: PublishLogInsert): Promise<PublishLogEntry | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('social_media_publish_log')
    .insert({
      user_id: entry.userId,
      episode_id: entry.episodeId,
      episode_title: entry.episodeTitle,
      platform: entry.platform,
      account_id: entry.accountId,
      account_handle: entry.accountHandle,
      status: entry.status,
      publish_type: entry.publishType,
      published_url: entry.publishedUrl || null,
      scheduled_at: entry.scheduledAt || null,
      error_message: entry.errorMessage || null,
    })
    .select('id, episode_id, episode_title, platform, account_handle, status, publish_type, published_url, scheduled_at, error_message, created_at')
    .single();
  if (error || !data) {
    logger.error('recordPublishLog fehlgeschlagen', { platform: entry.platform, error: error?.message });
    return null;
  }
  return {
    id: data.id,
    episodeId: data.episode_id,
    episodeTitle: data.episode_title,
    platform: data.platform,
    accountHandle: data.account_handle,
    status: data.status,
    publishType: data.publish_type,
    publishedUrl: data.published_url || undefined,
    scheduledAt: data.scheduled_at || undefined,
    timestamp: data.created_at,
    errorMessage: data.error_message || undefined,
  };
}

export async function listPublishLogForUser(userId: string, limit = 100): Promise<PublishLogEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('social_media_publish_log')
    .select('id, episode_id, episode_title, platform, account_handle, status, publish_type, published_url, scheduled_at, error_message, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    logger.error('listPublishLogForUser fehlgeschlagen', { error: error.message });
    return [];
  }
  return (data || []).map((row: Record<string, any>) => ({
    id: row.id,
    episodeId: row.episode_id,
    episodeTitle: row.episode_title,
    platform: row.platform,
    accountHandle: row.account_handle,
    status: row.status,
    publishType: row.publish_type,
    publishedUrl: row.published_url || undefined,
    scheduledAt: row.scheduled_at || undefined,
    timestamp: row.created_at,
    errorMessage: row.error_message || undefined,
  }));
}
