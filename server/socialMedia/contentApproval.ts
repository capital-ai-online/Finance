/**
 * SEO-GM-ROADMAP-0002 / WP-N4 — Content approval gate before instant publish.
 * In-memory until Supabase migration is applied (service-role only).
 * No auto-publish: pending content cannot go live without explicit approve.
 *
 * The approval is bound to a hash of the exact content and target platforms it
 * was granted for (ESS-0024 §10, ADR-0080 security invariant 5). Without that
 * binding an approval is a bare token: the Owner approves one text and the
 * publish call may carry a different one under the same approvalId. Any
 * material change to caption, title, hashtags, media asset, disclosures,
 * provenance identity, links or platform set therefore invalidates the approval.
 */

import { createHash } from 'node:crypto';

export type ContentApprovalStatus = 'pending' | 'approved' | 'rejected' | 'consumed';

/** Publish fields the approval is bound to. Everything here is Owner-visible. */
export interface ApprovalContentDescriptor {
  episodeTitle?: string;
  targetPlatforms?: string[];
  customCaptions?: Record<string, string | undefined>;
  hashtags?: string[];
  videoTitle?: string;
  /** Asset URL — a swapped media file is a material change (ESS-0024 §10). */
  mediaUrl?: string;
  mediaType?: string;
  /** SOCIAL-P0 canonical package/provenance correlation fields. */
  contentPackageId?: string;
  sourceContentId?: string;
  sourceDomain?: string;
  disclosures?: string[];
  links?: string[];
  referralDisclosure?: string;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => normalizeText(entry)).filter(Boolean).sort();
}

/**
 * Deterministic hash over the approval-relevant publish fields.
 *
 * Canonicalisation matters more than the digest: key order, array order and
 * surrounding whitespace must not change the result, or an unchanged payload
 * would be rejected depending on how the client happened to serialise it.
 */
export function computeContentHash(input: ApprovalContentDescriptor): string {
  const captions = input.customCaptions && typeof input.customCaptions === 'object'
    ? Object.entries(input.customCaptions)
        .map(([platform, caption]) => [normalizeText(platform), normalizeText(caption)] as const)
        .filter(([platform]) => platform)
        .sort((a, b) => a[0].localeCompare(b[0]))
    : [];

  const canonical = JSON.stringify({
    episodeTitle: normalizeText(input.episodeTitle),
    targetPlatforms: normalizeList(input.targetPlatforms),
    customCaptions: captions,
    hashtags: normalizeList(input.hashtags),
    videoTitle: normalizeText(input.videoTitle),
    mediaUrl: normalizeText(input.mediaUrl),
    mediaType: normalizeText(input.mediaType),
    contentPackageId: normalizeText(input.contentPackageId),
    sourceContentId: normalizeText(input.sourceContentId),
    sourceDomain: normalizeText(input.sourceDomain),
    disclosures: normalizeList(input.disclosures),
    links: normalizeList(input.links),
    referralDisclosure: normalizeText(input.referralDisclosure),
  });

  return createHash('sha256').update(canonical).digest('hex');
}

export interface ContentApprovalRecord {
  id: string;
  userId: string;
  title: string;
  topic?: string;
  platforms: string[];
  /** Opaque package snapshot (text variants / captions) — not executed by this module. */
  payloadSummary: string;
  /** sha256 over the exact content + platform set this approval is granted for. */
  contentHash: string;
  status: ContentApprovalStatus;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionNote?: string;
}

export interface CreateApprovalInput {
  userId: string;
  title: string;
  topic?: string;
  platforms?: string[];
  payloadSummary?: string;
  scheduledAt?: string;
  /** Exact content this approval is requested for. Bound via contentHash. */
  content: ApprovalContentDescriptor;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `cap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Default: gate ON in production; opt-out via SOCIAL_MEDIA_REQUIRE_APPROVAL=false */
export function isApprovalGateEnabled(): boolean {
  if (process.env.SOCIAL_MEDIA_REQUIRE_APPROVAL === 'false') return false;
  if (process.env.SOCIAL_MEDIA_REQUIRE_APPROVAL === 'true') return true;
  return process.env.NODE_ENV === 'production';
}

class ContentApprovalStore {
  private rows: ContentApprovalRecord[] = [];

  create(input: CreateApprovalInput): ContentApprovalRecord {
    const title = String(input.title || '').trim();
    if (!title) throw new Error('title is required');
    if (!input.userId) throw new Error('userId is required');
    const t = nowIso();
    const row: ContentApprovalRecord = {
      id: newId(),
      userId: input.userId,
      title,
      topic: input.topic,
      platforms: Array.isArray(input.platforms) ? input.platforms.map(String) : [],
      payloadSummary: String(input.payloadSummary || '').slice(0, 4000),
      contentHash: computeContentHash(input.content || {}),
      status: 'pending',
      scheduledAt: input.scheduledAt,
      createdAt: t,
      updatedAt: t,
    };
    this.rows.unshift(row);
    return row;
  }

  listForUser(userId: string, status?: ContentApprovalStatus): ContentApprovalRecord[] {
    return this.rows
      .filter((r) => r.userId === userId && (!status || r.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): ContentApprovalRecord | undefined {
    return this.rows.find((r) => r.id === id);
  }

  approve(id: string, decidedBy: string, note?: string): ContentApprovalRecord {
    const row = this.get(id);
    if (!row) throw new Error('approval not found');
    if (row.status !== 'pending') throw new Error(`cannot approve status=${row.status}`);
    row.status = 'approved';
    row.decidedAt = nowIso();
    row.decidedBy = decidedBy;
    row.decisionNote = note;
    row.updatedAt = row.decidedAt;
    return row;
  }

  reject(id: string, decidedBy: string, note?: string): ContentApprovalRecord {
    const row = this.get(id);
    if (!row) throw new Error('approval not found');
    if (row.status !== 'pending') throw new Error(`cannot reject status=${row.status}`);
    row.status = 'rejected';
    row.decidedAt = nowIso();
    row.decidedBy = decidedBy;
    row.decisionNote = note;
    row.updatedAt = row.decidedAt;
    return row;
  }

  /**
   * Validate that approvalId is usable for instant publish by this user and
   * covers exactly the content being published.
   *
   * Fails closed: the approval is only consumed when the recomputed hash of the
   * outgoing payload matches the hash the Owner approved. A mismatch leaves the
   * approval `approved` so the Owner can re-approve the corrected content
   * instead of losing the record.
   */
  consumeForPublish(
    id: string,
    userId: string,
    content: ApprovalContentDescriptor,
  ): ContentApprovalRecord {
    const row = this.get(id);
    if (!row) throw new Error('approval not found');
    if (row.userId !== userId) throw new Error('approval belongs to another user');
    if (row.status !== 'approved') {
      throw new Error(`approval not approved (status=${row.status})`);
    }

    const publishHash = computeContentHash(content || {});
    if (publishHash !== row.contentHash) {
      throw new Error(
        'content does not match the approved version (caption, title, hashtags, media asset, disclosures, provenance, links or platform set changed) - re-approval required',
      );
    }

    row.status = 'consumed';
    row.updatedAt = nowIso();
    return row;
  }

  resetForTests(): void {
    this.rows = [];
  }
}

export const contentApprovalStore = new ContentApprovalStore();