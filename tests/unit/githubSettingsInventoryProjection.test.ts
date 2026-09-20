import { describe, expect, it } from 'vitest';
import {
  projectArtifactStorageInventory,
  projectCacheStorageLimit,
  projectCacheUsage,
} from '../../scripts/operations/githubSettingsInventoryProjection.mjs';

describe('GitHub settings storage projection', () => {
  it('normalizes repository and organization cache usage shapes', () => {
    expect(projectCacheUsage({
      full_name: 'capital-ai-online/Finance',
      active_caches_size_in_bytes: 1024,
      active_caches_count: 2,
    })).toEqual({
      activeCachesCount: 2,
      activeCachesSizeInBytes: 1024,
      activeCachesSizeGiB: 0.000001,
      fullName: 'capital-ai-online/Finance',
    });

    expect(projectCacheUsage({
      total_active_caches_size_in_bytes: 2048,
      total_active_caches_count: 3,
    })).toEqual({
      activeCachesCount: 3,
      activeCachesSizeInBytes: 2048,
      activeCachesSizeGiB: 0.000002,
      fullName: null,
    });
  });

  it('projects cache limits without mutation semantics', () => {
    expect(projectCacheStorageLimit({ max_cache_size_gb: 10 })).toEqual({
      maxCacheSizeGiB: 10,
    });
  });

  it('sums only active artifact bytes and redacts names and workflow identity', () => {
    expect(projectArtifactStorageInventory({
      total_count: 3,
      artifacts: [
        { name: 'one', size_in_bytes: 1024, expired: false, workflow_run: { id: 1 } },
        { name: 'two', size_in_bytes: 2048, expired: false, workflow_run: { id: 2 } },
        { name: 'old', size_in_bytes: 4096, expired: true, workflow_run: { id: 3 } },
      ],
    })).toEqual({
      totalCount: 3,
      observedCount: 3,
      activeCount: 2,
      expiredCount: 1,
      activeSizeInBytes: 3072,
      activeSizeGiB: 0.000003,
      namesRedacted: true,
      workflowIdentityRedacted: true,
    });
  });
});
