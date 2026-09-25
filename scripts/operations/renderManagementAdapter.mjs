const RENDER_API_BASE = 'https://api.render.com/v1';

export const RENDER_MANAGEMENT_ACTIONS = Object.freeze([
  'inventory',
  'delete-suspended-validation-services',
  'delete-unused-registry-credential',
  'spend-limit-capability',
]);

export const EXPECTED_FINANCE_SERVICE = Object.freeze({
  id: 'srv-d91o1o9o3t8c73edi55g',
  name: 'Finance',
  type: 'web_service',
});

export const EXPECTED_REGISTRY_CREDENTIAL = Object.freeze({
  id: 'rgc-d9saj5c9v7es73ei60mg',
  name: 'capital-ai-container-registr',
  registry: 'GITHUB',
});

export const RENDER_WORKSPACE_PLAN_LIMITS = Object.freeze({
  hobby: Object.freeze({
    serviceLimit: 25,
    customDomainLimit: 2,
    includedBandwidthGb: 5,
    includedPipelineMinutes: 500,
  }),
  pro: Object.freeze({
    serviceLimit: null,
    customDomainLimit: 15,
    includedBandwidthGb: 25,
    includedPipelineMinutes: 1_000,
  }),
  scale: Object.freeze({
    serviceLimit: null,
    customDomainLimit: 25,
    includedBandwidthGb: 1_024,
    includedPipelineMinutes: 5_000,
  }),
  enterprise: Object.freeze({
    serviceLimit: null,
    customDomainLimit: null,
    includedBandwidthGb: null,
    includedPipelineMinutes: null,
  }),
});

export const EXPECTED_SUSPENDED_VALIDATION_SERVICES = Object.freeze([
  ['srv-daklche1egvs738f7fn0', 'capital-ai-social-p3-identity-newfiles-973e226'],
  ['srv-daklbt5g1s2s73cno3ig', 'capital-ai-social-p3-identity-local-973e226'],
  ['srv-daklb7nqj5pc73bjnjng', 'capital-ai-social-p3-identity-973e226'],
  ['srv-daklagh42hec73avt81g', 'capital-ai-social-p3-exact-head-973e226'],
  ['srv-dakkcu61egvs738c7bqg', 'capital-ai-fintech-fin-sec-03-main-validator-2c607fc'],
  ['srv-dakkbvrm8hqs73eteiv0', 'capital-ai-fintech-fin-sec-03-head-artifact-2c607fc'],
  ['srv-dakkaurm8hqs73etbke0', 'capital-ai-fintech-fin-sec-03-exact-head-2c607fc-r3'],
  ['srv-dakkajqfngtc73ao7ul0', 'capital-ai-fintech-fin-sec-03-exact-head-2c607fc-r2'],
  ['srv-dakk97jl550s73fh4b4g', 'capital-ai-fintech-fin-sec-03-exact-head-2c607fc'],
  ['srv-dak9ajnqj5pc73aad98g', 'capital-ai-gov-effective-change-main-4a62d5b7'],
  ['srv-dak9a5h42hec739o0c7g', 'capital-ai-gov-head-artifact-4a62d5b7'],
  ['srv-dak95ep5efls73d5g120', 'capital-ai-gov-production-baseline-dag-4a62d5b7'],
  ['srv-dak94b3m8hqs73dnvsag', 'capital-ai-gov-production-baseline-main-4a62d5b7'],
  ['srv-dak8rrbm8hqs73dn10bg', 'capital-ai-gov-approval-validate-4a62d5b7-r2'],
  ['srv-dak8r6h5efls73d4b1rg', 'capital-ai-gov-approval-validate-4a62d5b7'],
  ['srv-dak5oavf3r2c73c6ktq0', 'capital-ai-gov-approval-validate-e7317286-duplicate-check'],
  ['srv-dak5o8h594qs738fr5ig', 'capital-ai-gov-approval-validate-e7317286'],
  ['srv-daenjef40ujc73800720', 'capital-ai-fe-pr-baseline-health-be0f1e4a'],
  ['srv-daenhif40ujc73fvotq0', 'capital-ai-fe-bb2e-validation-be0f1e4a'],
  ['srv-daemnv6q1p3s73a0omlg', 'capital-ai-fe-bb2e-validation-3bc7fdcd'],
  ['srv-daemcseq1p3s73ar8n4g', 'capital-ai-fe-bb2e-build-4a296b58'],
  ['srv-daembm1t0dsc73ar8n4g', 'capital-ai-fe-bb2e-validation-4a296b58'],
].map(([id, name]) => Object.freeze({ id, name, type: 'static_site' })));

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeWorkspacePlan(value) {
  const plan = clean(value).toLowerCase();
  return Object.hasOwn(RENDER_WORKSPACE_PLAN_LIMITS, plan) ? plan : null;
}

function safeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function projectRegistryCredential(service) {
  const credential = service?.serviceDetails?.envSpecificDetails?.registryCredential;
  if (!credential || typeof credential !== 'object') return null;
  return Object.freeze({
    id: clean(credential.id) || null,
    name: clean(credential.name) || null,
    registry: clean(credential.registry) || null,
  });
}

export function projectRenderServiceSettings(service) {
  const details = service?.serviceDetails && typeof service.serviceDetails === 'object'
    ? service.serviceDetails
    : {};
  return Object.freeze({
    id: clean(service?.id) || null,
    name: clean(service?.name) || null,
    type: clean(service?.type) || null,
    suspended: clean(service?.suspended) || null,
    branch: clean(service?.branch) || null,
    autoDeploy: clean(service?.autoDeploy) || null,
    autoDeployTrigger: clean(service?.autoDeployTrigger) || null,
    notifyOnFail: clean(service?.notifyOnFail) || null,
    computePlan: clean(details.plan) || null,
    buildPlan: clean(details.buildPlan) || null,
    region: clean(details.region) || null,
    healthCheckPath: clean(details.healthCheckPath) || null,
    cacheProfile: clean(details?.cache?.profile) || null,
    previewGeneration: clean(details?.previews?.generation) || null,
    pullRequestPreviewsEnabled: clean(details.pullRequestPreviewsEnabled) || null,
    renderSubdomainPolicy: clean(details.renderSubdomainPolicy) || null,
    runtime: clean(details.runtime || details.env) || null,
    instances: safeNumber(details.numInstances),
    maintenanceModeEnabled: details?.maintenanceMode?.enabled === true,
    registryCredential: projectRegistryCredential(service),
  });
}

function safeProviderStatus(error) {
  return Number.isInteger(error?.status) ? error.status : null;
}

async function optionalProviderRead(readFn) {
  try {
    return Object.freeze({ status: 'PASS', value: await readFn(), providerStatus: null });
  } catch (error) {
    return Object.freeze({
      status: 'ERROR',
      value: null,
      providerStatus: safeProviderStatus(error),
    });
  }
}

function fail(message) {
  throw new Error(`[RENDER-MANAGEMENT] ${message}`);
}

function providerError(message, status) {
  const error = new Error(`[RENDER-MANAGEMENT] ${message}`);
  error.status = status;
  return error;
}

function unwrapCollection(payload, key) {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((entry) => entry && typeof entry === 'object' && entry[key] ? entry[key] : entry)
    .filter((entry) => entry && typeof entry === 'object');
}

async function requestRender({
  apiKey,
  path,
  method = 'GET',
  fetchImpl = fetch,
  expectedStatuses = [200],
  jsonBody = undefined,
}) {
  const token = clean(apiKey);
  if (!token) fail('CAPITAL_AI_RENDER_API_KEY is required');
  const response = await fetchImpl(`${RENDER_API_BASE}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(jsonBody === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(jsonBody === undefined ? {} : { body: JSON.stringify(jsonBody) }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!expectedStatuses.includes(response.status)) {
    throw providerError(`${method} ${path} failed with HTTP ${response.status}`, response.status);
  }

  if (response.status === 204) return null;
  return response.json().catch(() => null);
}

export async function listRenderServices({
  apiKey,
  workspaceId,
  fetchImpl = fetch,
} = {}) {
  const ownerId = clean(workspaceId);
  if (!ownerId) fail('CAPITAL_AI_RENDER_WORKSPACE_ID is required');
  const query = new URLSearchParams({
    ownerId,
    includePreviews: 'true',
    limit: '100',
  });
  const payload = await requestRender({
    apiKey,
    path: `/services?${query.toString()}`,
    fetchImpl,
  });
  return Object.freeze(unwrapCollection(payload, 'service'));
}


export async function listRenderCustomDomains({
  apiKey,
  serviceId,
  fetchImpl = fetch,
} = {}) {
  const id = clean(serviceId);
  if (!id) fail('serviceId is required for custom-domain inventory');
  const payload = await requestRender({
    apiKey,
    path: `/services/${encodeURIComponent(id)}/custom-domains?limit=100`,
    fetchImpl,
  });
  return Object.freeze(
    unwrapCollection(payload, 'customDomain').map((domain) => Object.freeze({
      id: clean(domain?.id) || null,
      name: clean(domain?.name) || null,
      domainType: clean(domain?.domainType) || null,
      verificationStatus: clean(domain?.verificationStatus) || null,
      redirectForName: clean(domain?.redirectForName) || null,
    })),
  );
}

async function listRenderCollection({
  apiKey,
  workspaceId,
  path,
  key,
  fetchImpl = fetch,
}) {
  const ownerId = clean(workspaceId);
  if (!ownerId) fail('CAPITAL_AI_RENDER_WORKSPACE_ID is required');
  const query = new URLSearchParams({ ownerId, limit: '100' });
  const payload = await requestRender({
    apiKey,
    path: `${path}?${query.toString()}`,
    fetchImpl,
  });
  return unwrapCollection(payload, key);
}

export async function listRenderWorkflows(options = {}) {
  const rows = await listRenderCollection({
    ...options,
    path: '/workflows',
    key: 'workflow',
  });
  return Object.freeze(rows.map((workflow) => Object.freeze({
    id: clean(workflow?.id) || null,
    name: clean(workflow?.name) || null,
    slug: clean(workflow?.slug) || null,
    environmentId: clean(workflow?.environmentId) || null,
    region: clean(workflow?.region) || null,
    autoDeployTrigger: clean(workflow?.autoDeployTrigger) || null,
    createdAt: clean(workflow?.createdAt) || null,
    updatedAt: clean(workflow?.updatedAt) || null,
  })));
}

export async function listRenderTasks(options = {}) {
  const rows = await listRenderCollection({
    ...options,
    path: '/tasks',
    key: 'task',
  });
  return Object.freeze(rows.map((task) => Object.freeze({
    id: clean(task?.id) || null,
    name: clean(task?.name) || null,
    slug: clean(task?.slug || task?.taskSlug) || null,
    workflowId: clean(task?.workflowId) || null,
    workflowVersionId: clean(task?.workflowVersionId) || null,
  })));
}

export async function listRenderTaskRuns(options = {}) {
  const rows = await listRenderCollection({
    ...options,
    path: '/task-runs',
    key: 'taskRun',
  });
  return Object.freeze(rows.map((run) => Object.freeze({
    id: clean(run?.id) || null,
    taskSlug: clean(run?.taskSlug) || null,
    state: clean(run?.state || run?.status) || null,
    workflowId: clean(run?.workflowId) || null,
    workflowVersionId: clean(run?.workflowVersionId) || null,
    createdAt: clean(run?.createdAt) || null,
    startedAt: clean(run?.startedAt) || null,
    finishedAt: clean(run?.finishedAt) || null,
  })));
}

export async function readRenderNotificationOverride({
  apiKey,
  serviceId,
  fetchImpl = fetch,
} = {}) {
  const id = clean(serviceId);
  if (!id) fail('serviceId is required for notification inventory');
  const payload = await requestRender({
    apiKey,
    path: `/notification-settings/overrides/services/${encodeURIComponent(id)}`,
    fetchImpl,
  });
  return Object.freeze({
    notificationsToSend: clean(payload?.notificationsToSend) || null,
    previewNotificationsEnabled: clean(payload?.previewNotificationsEnabled) || null,
  });
}

function monthStartIso(now) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
}

export function summarizeBandwidthPayload(payload) {
  const groups = Array.isArray(payload?.metrics)
    ? payload.metrics.flatMap((metric) => Array.isArray(metric?.data) ? metric.data : [])
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

  let sampleCount = 0;
  let total = 0;
  let unit = null;
  for (const group of groups) {
    if (!unit) unit = clean(group?.unit).toLowerCase() || null;
    const values = Array.isArray(group?.values) ? group.values : [];
    for (const point of values) {
      const value = safeNumber(point?.value);
      if (value === null) continue;
      total += value;
      sampleCount += 1;
    }
  }

  const totalRounded = Number(total.toFixed(6));
  const approxGb = unit === 'mb'
    ? Number((total / 1_024).toFixed(6))
    : unit === 'gb'
      ? totalRounded
      : null;

  return Object.freeze({
    sampleCount,
    unit,
    total: totalRounded,
    approxGb,
  });
}

export async function readRenderBandwidthUsage({
  apiKey,
  serviceId,
  now = new Date(),
  fetchImpl = fetch,
} = {}) {
  const id = clean(serviceId);
  if (!id) fail('serviceId is required for bandwidth inventory');
  const query = new URLSearchParams({
    resource: id,
    startTime: monthStartIso(now),
    endTime: now.toISOString(),
  });
  const payload = await requestRender({
    apiKey,
    path: `/metrics/bandwidth?${query.toString()}`,
    fetchImpl,
  });
  return Object.freeze({
    periodStart: monthStartIso(now),
    periodEnd: now.toISOString(),
    serviceId: id,
    ...summarizeBandwidthPayload(payload),
  });
}

/**
 * @param {{
 *   apiKey?: string | null;
 *   workspaceId?: string | null;
 *   workspacePlan?: string | null;
 *   now?: Date;
 *   fetchImpl?: typeof fetch;
 * }} [options]
 */
export async function buildRenderSettingsInventory({
  apiKey,
  workspaceId,
  workspacePlan = null,
  now = new Date(),
  fetchImpl = fetch,
} = {}) {
  const services = await listRenderServices({ apiKey, workspaceId, fetchImpl });
  const serviceSettings = Object.freeze(services.map(projectRenderServiceSettings));
  const plan = normalizeWorkspacePlan(workspacePlan);
  const planLimits = plan ? RENDER_WORKSPACE_PLAN_LIMITS[plan] : null;

  const customDomainRows = [];
  const customDomainErrors = [];
  for (const service of services) {
    if (!['web_service', 'static_site'].includes(clean(service?.type))) continue;
    const read = await optionalProviderRead(() => listRenderCustomDomains({
      apiKey,
      serviceId: service.id,
      fetchImpl,
    }));
    if (read.status === 'PASS') {
      customDomainRows.push(Object.freeze({
        serviceId: clean(service?.id) || null,
        serviceName: clean(service?.name) || null,
        domains: read.value,
      }));
    } else {
      customDomainErrors.push(Object.freeze({
        serviceId: clean(service?.id) || null,
        providerStatus: read.providerStatus,
      }));
    }
  }

  const workflowsRead = await optionalProviderRead(() => listRenderWorkflows({ apiKey, workspaceId, fetchImpl }));
  const tasksRead = await optionalProviderRead(() => listRenderTasks({ apiKey, workspaceId, fetchImpl }));
  const taskRunsRead = await optionalProviderRead(() => listRenderTaskRuns({ apiKey, workspaceId, fetchImpl }));

  const finance = services.find((service) => clean(service?.id) === EXPECTED_FINANCE_SERVICE.id) || null;
  const notificationRead = finance
    ? await optionalProviderRead(() => readRenderNotificationOverride({
        apiKey,
        serviceId: finance.id,
        fetchImpl,
      }))
    : Object.freeze({ status: 'NOT_APPLICABLE', value: null, providerStatus: null });
  const bandwidthRead = finance
    ? await optionalProviderRead(() => readRenderBandwidthUsage({
        apiKey,
        serviceId: finance.id,
        now,
        fetchImpl,
      }))
    : Object.freeze({ status: 'NOT_APPLICABLE', value: null, providerStatus: null });

  const customDomainCount = customDomainErrors.length === 0
    ? customDomainRows.reduce((sum, row) => sum + row.domains.length, 0)
    : null;
  const serviceLimit = planLimits?.serviceLimit ?? null;
  const customDomainLimit = planLimits?.customDomainLimit ?? null;

  return Object.freeze({
    status: customDomainErrors.length === 0 ? 'PASS' : 'PARTIAL',
    workspace: Object.freeze({
      id: clean(workspaceId) || null,
      plan,
      planSource: plan ? 'CAPITAL_AI_RENDER_WORKSPACE_PLAN' : 'NOT_CONFIGURED',
      limits: planLimits,
      services: Object.freeze({
        used: services.length,
        included: serviceLimit,
        remaining: typeof serviceLimit === 'number' ? Math.max(0, serviceLimit - services.length) : null,
      }),
      customDomains: Object.freeze({
        used: customDomainCount,
        included: customDomainLimit,
        remaining: typeof customDomainCount === 'number' && typeof customDomainLimit === 'number'
          ? Math.max(0, customDomainLimit - customDomainCount)
          : null,
        coverage: customDomainErrors.length === 0 ? 'PASS' : 'PARTIAL',
      }),
      pipeline: Object.freeze({
        includedMinutes: planLimits?.includedPipelineMinutes ?? null,
        currentUsageMinutes: null,
        remainingIncludedMinutes: null,
        usageStatus: 'NOT_OBSERVABLE_VIA_RENDER_PUBLIC_API',
      }),
      bandwidth: Object.freeze({
        includedGb: planLimits?.includedBandwidthGb ?? null,
        financeMonthToDate: bandwidthRead.value,
        financeCoverage: bandwidthRead.status,
        exactWorkspaceMonthToDateGb: null,
        workspaceUsageStatus: 'FINANCE_SERVICE_METRIC_ONLY_NOT_BILLING_AGGREGATE',
      }),
      overlappingDeployPolicy: Object.freeze({
        status: 'NOT_EXPOSED_BY_PUBLIC_API',
        dashboardReadbackRequired: true,
      }),
    }),
    services: serviceSettings,
    customDomains: Object.freeze({
      coverage: customDomainErrors.length === 0 ? 'PASS' : 'PARTIAL',
      rows: Object.freeze(customDomainRows),
      errors: Object.freeze(customDomainErrors),
    }),
    workflows: Object.freeze({
      coverage: workflowsRead.status,
      count: Array.isArray(workflowsRead.value) ? workflowsRead.value.length : null,
      rows: workflowsRead.value || Object.freeze([]),
    }),
    tasks: Object.freeze({
      coverage: tasksRead.status,
      count: Array.isArray(tasksRead.value) ? tasksRead.value.length : null,
      rows: tasksRead.value || Object.freeze([]),
    }),
    taskRuns: Object.freeze({
      coverage: taskRunsRead.status,
      count: Array.isArray(taskRunsRead.value) ? taskRunsRead.value.length : null,
      rows: taskRunsRead.value || Object.freeze([]),
    }),
    notifications: Object.freeze({
      financeServiceSetting: finance ? clean(finance.notifyOnFail) || null : null,
      financeOverrideCoverage: notificationRead.status,
      financeOverride: notificationRead.value,
      workspaceDefault: 'NOT_EXPOSED_BY_PUBLIC_API',
    }),
    edgeCaching: Object.freeze({
      financeCurrentProfile: finance ? clean(finance?.serviceDetails?.cache?.profile) || null : null,
      recommendation: 'common-static-files',
      recommendationStatus: 'READ_ONLY_RECOMMENDATION_NOT_APPLIED',
      allFiles: 'BLOCKED_PENDING_EXPLICIT_DYNAMIC_CACHE_POLICY_COVERAGE',
    }),
    secretsOrTokensProjected: false,
  });
}

export async function triggerRenderExactCommitDeploy({
  apiKey,
  serviceId = EXPECTED_FINANCE_SERVICE.id,
  commitId,
  fetchImpl = fetch,
} = {}) {
  const id = clean(serviceId);
  if (id !== EXPECTED_FINANCE_SERVICE.id) {
    fail(`exact Finance service id required; received ${id || 'missing'}`);
  }
  const sha = clean(commitId).toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    fail('commitId must be an exact 40-character Git commit SHA');
  }
  const payload = await requestRender({
    apiKey,
    path: `/services/${encodeURIComponent(id)}/deploys`,
    method: 'POST',
    fetchImpl,
    expectedStatuses: [200, 201, 202],
    jsonBody: {
      commitId: sha,
      clearCache: 'do_not_clear',
    },
  });
  return Object.freeze({
    status: 'TRIGGERED',
    serviceId: id,
    commitId: sha,
    deployId: clean(payload?.id || payload?.deploy?.id) || null,
    deployStatus: clean(payload?.status || payload?.deploy?.status) || null,
    credentialProjected: false,
  });
}

export function planSuspendedValidationServiceDeletion(services = []) {
  const byId = new Map(services.map((service) => [clean(service?.id), service]));
  const candidates = [];
  const alreadyAbsent = [];
  const blocked = [];

  for (const expected of EXPECTED_SUSPENDED_VALIDATION_SERVICES) {
    const observed = byId.get(expected.id);
    if (!observed) {
      alreadyAbsent.push(expected);
      continue;
    }

    const exactIdentity =
      clean(observed.name) === expected.name
      && clean(observed.type) === expected.type
      && clean(observed.suspended) === 'suspended';

    if (!exactIdentity) {
      blocked.push(Object.freeze({
        id: expected.id,
        expectedName: expected.name,
        observedName: clean(observed.name) || null,
        observedType: clean(observed.type) || null,
        observedSuspended: clean(observed.suspended) || null,
      }));
      continue;
    }

    candidates.push(Object.freeze({
      id: expected.id,
      name: expected.name,
      type: expected.type,
    }));
  }

  if (candidates.some((candidate) => candidate.id === EXPECTED_FINANCE_SERVICE.id)) {
    fail('Finance service must never enter the suspended validation deletion plan');
  }

  return Object.freeze({
    expectedCount: EXPECTED_SUSPENDED_VALIDATION_SERVICES.length,
    candidateCount: candidates.length,
    alreadyAbsentCount: alreadyAbsent.length,
    blockedCount: blocked.length,
    candidates: Object.freeze(candidates),
    alreadyAbsent: Object.freeze(alreadyAbsent),
    blocked: Object.freeze(blocked),
  });
}

export async function deleteSuspendedValidationServices({
  apiKey,
  workspaceId,
  confirmation,
  fetchImpl = fetch,
} = {}) {
  if (confirmation !== 'DELETE_22_SUSPENDED_VALIDATION_SERVICES') {
    fail('exact deletion confirmation is required');
  }

  const before = await listRenderServices({ apiKey, workspaceId, fetchImpl });
  const plan = planSuspendedValidationServiceDeletion(before);
  if (plan.blockedCount > 0) {
    fail(`live Render identity drift blocks deletion for ${plan.blockedCount} allowlisted service(s)`);
  }

  const deleted = [];
  for (const candidate of plan.candidates) {
    await requestRender({
      apiKey,
      path: `/services/${encodeURIComponent(candidate.id)}`,
      method: 'DELETE',
      fetchImpl,
      expectedStatuses: [204, 404, 410],
    });
    deleted.push(candidate);
  }

  const after = await listRenderServices({ apiKey, workspaceId, fetchImpl });
  const afterPlan = planSuspendedValidationServiceDeletion(after);
  if (afterPlan.candidateCount > 0 || afterPlan.blockedCount > 0) {
    fail('post-delete readback did not converge');
  }

  return Object.freeze({
    status: 'PASS',
    mutation: 'DELETE_SUSPENDED_VALIDATION_SERVICES',
    deletedCount: deleted.length,
    alreadyAbsentCount: plan.alreadyAbsentCount,
    remainingAllowlistedCount: 0,
    financeProtected: true,
    secretsOrTokensLogged: false,
  });
}

export function registryCredentialConsumers(services = [], credentialId = EXPECTED_REGISTRY_CREDENTIAL.id) {
  return Object.freeze(
    services
      .filter((service) =>
        clean(service?.serviceDetails?.envSpecificDetails?.registryCredential?.id) === credentialId)
      .map((service) => Object.freeze({
        id: clean(service?.id) || null,
        name: clean(service?.name) || null,
        type: clean(service?.type) || null,
      })),
  );
}

export async function inspectRegistryCredentialUsage({
  apiKey,
  workspaceId,
  fetchImpl = fetch,
} = {}) {
  const services = await listRenderServices({ apiKey, workspaceId, fetchImpl });
  const consumers = registryCredentialConsumers(services);
  return Object.freeze({
    credential: EXPECTED_REGISTRY_CREDENTIAL,
    consumers,
    inUse: consumers.length > 0,
    deletionEligible: consumers.length === 0,
  });
}

/**
 * @param {{
 *   apiKey?: string,
 *   workspaceId?: string,
 *   confirmation?: string,
 *   fetchImpl?: typeof fetch,
 * }} [options]
 */
export async function deleteUnusedRegistryCredential({
  apiKey,
  workspaceId,
  confirmation,
  fetchImpl = fetch,
} = {}) {
  if (confirmation !== 'DELETE_UNUSED_RENDER_REGISTRY_CREDENTIAL') {
    fail('exact registry-credential deletion confirmation is required');
  }

  const usage = await inspectRegistryCredentialUsage({ apiKey, workspaceId, fetchImpl });
  if (usage.inUse) {
    return Object.freeze({
      status: 'BLOCKED_IN_USE',
      mutationPerformed: false,
      credential: EXPECTED_REGISTRY_CREDENTIAL,
      consumers: usage.consumers,
      secretsOrTokensLogged: false,
    });
  }

  await requestRender({
    apiKey,
    path: `/registrycredentials/${encodeURIComponent(EXPECTED_REGISTRY_CREDENTIAL.id)}`,
    method: 'DELETE',
    fetchImpl,
    expectedStatuses: [204, 404, 410],
  });

  return Object.freeze({
    status: 'PASS',
    mutationPerformed: true,
    credential: EXPECTED_REGISTRY_CREDENTIAL,
    secretsOrTokensLogged: false,
  });
}

export function describeSpendLimitCapability() {
  return Object.freeze({
    status: 'NOT_SUPPORTED_BY_PUBLIC_API',
    requestedWarningThresholdMinutes: 480,
    includedHobbyPipelineMinutes: 500,
    requestedRecipient: 'support@capital-ai.online',
    spendLimitSemantics: 'Render spend limits cap paid pipeline-minute overage after included minutes; they are not an included-minute warning threshold.',
    exactUsageReadback: 'NOT_OBSERVABLE_VIA_RENDER_PUBLIC_API',
    supportedProviderEvent: 'pipeline_minutes_exhausted',
    supportedProviderEventSemantics: 'fires only after pipeline capacity is exhausted or blocked, so it cannot implement a 480-minute early warning',
  });
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return '';
  return String(process.argv[index + 1] || '').trim();
}

async function main() {
  const action = readArg('--action') || 'inventory';
  if (!RENDER_MANAGEMENT_ACTIONS.includes(action)) {
    fail(`unsupported action: ${action}`);
  }

  const common = {
    apiKey: process.env.CAPITAL_AI_RENDER_API_KEY,
    workspaceId: process.env.CAPITAL_AI_RENDER_WORKSPACE_ID,
  };

  let result;
  if (action === 'inventory') {
    const services = await listRenderServices(common);
    const deletionPlan = planSuspendedValidationServiceDeletion(services);
    const registry = await inspectRegistryCredentialUsage(common);
    const settingsInventory = await buildRenderSettingsInventory({
      ...common,
      workspacePlan: process.env.CAPITAL_AI_RENDER_WORKSPACE_PLAN,
    });
    result = Object.freeze({
      status: deletionPlan.blockedCount === 0 && settingsInventory.status !== 'ERROR'
        ? settingsInventory.status
        : 'BLOCKED_IDENTITY_DRIFT',
      action,
      serviceCount: services.length,
      settingsInventory,
      suspendedDeletionPlan: deletionPlan,
      registryCredential: registry,
      spendLimit: describeSpendLimitCapability(),
      secretsOrTokensLogged: false,
    });
  } else if (action === 'delete-suspended-validation-services') {
    result = await deleteSuspendedValidationServices({
      ...common,
      confirmation: readArg('--confirm'),
    });
  } else if (action === 'delete-unused-registry-credential') {
    result = await deleteUnusedRegistryCredential({
      ...common,
      confirmation: readArg('--confirm'),
    });
  } else {
    result = describeSpendLimitCapability();
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('renderManagementAdapter.mjs')) {
  main().catch((error) => {
    process.stderr.write(`${error?.message || 'Render management failed'}\n`);
    process.exit(1);
  });
}
