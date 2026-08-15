/**
 * SEO-ROADMAP-0001 / N4 — Content approval gate before instant publish.
 * In-memory until Supabase migration is applied (service-role only).
 * No auto-publish: pending content cannot go live without explicit approve.
 */

export type ContentApprovalStatus = 'pending' | 'approved' | 'rejected' | 'consumed';

export interface ContentApprovalRecord {
  id: string;
  userId: string;
  title: string;
  topic?: string;
  platforms: string[];
  /** Opaque package snapshot (text variants / captions) — not executed by this module. */
  payloadSummary: string;
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
   * Validate that approvalId is usable for instant publish by this user.
   * Marks as consumed so the same approval cannot be reused.
   */
  consumeForPublish(id: string, userId: string): ContentApprovalRecord {
    const row = this.get(id);
    if (!row) throw new Error('approval not found');
    if (row.userId !== userId) throw new Error('approval belongs to another user');
    if (row.status !== 'approved') {
      throw new Error(`approval not approved (status=${row.status})`);
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
