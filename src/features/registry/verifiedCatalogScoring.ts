import { getAssetCatalogEntry } from '../../lib/assetSearchCatalog';
import { generateTraditionalAssetInputs } from '../../services/traditionalAssetScoring';
import { buildIndexScoringInputsFromEvidence, getVerifiedIndexHistory } from '../../services/indexMarketEvidence';
import { getTwelveDataCommodityEvidence } from '../../services/commodityMarketEvidence';
import { resolveSovereignBondProviderMapping } from '../../services/sovereignBondProviderMapping';
import { getEodhdBondEvidence } from '../../services/eodhdBondEvidence';
import { dispatchCanonicalScore, type ScoringModelDescriptor } from '../../platform/Scoring';
import { ensureFundamentalsFresh, getCachedFundamentals } from '../../../server/stockFundamentals';

export interface VerifiedCatalogEvaluation {
  httpStatus: number;
  payload: Record<string, unknown>;
}

function modelRegistryView(model: ScoringModelDescriptor | null) {
  if (!model) return null;
  return {
    registryVersion: model.registryVersion,
    modelId: model.modelId,
    version: model.version,
    alias: model.alias,
    lifecycle: model.lifecycle,
    executorKey: model.executorKey,
    featureContractVersion: model.featureContractVersion,
    resultContractVersion: model.resultContractVersion,
    evidencePolicy: model.evidencePolicy,
  };
}

function lineage(input: {
  correlationId: string;
  assetId: string;
  assetClass: string;
  model: ScoringModelDescriptor | null;
  providers: string[];
  evidenceIds: string[];
  extra?: Record<string, unknown>;
}) {
  return {
    correlationId: input.correlationId,
    assetId: input.assetId,
    assetClass: input.assetClass,
    modelRegistryVersion: input.model?.registryVersion ?? null,
    modelId: input.model?.modelId ?? null,
    modelVersion: input.model?.version ?? null,
    modelAlias: input.model?.alias ?? null,
    executorKey: input.model?.executorKey ?? null,
    providers: input.providers,
    evidenceIds: input.evidenceIds,
    generatedAt: new Date().toISOString(),
    ...input.extra,
  };
}

function failurePayload(
  correlationId: string,
  symbol: string,
  assetType: string,
  dispatch: Awaited<ReturnType<typeof dispatchCanonicalScore>>,
  reason?: string,
): VerifiedCatalogEvaluation {
  const providers = dispatch.canonical.integrity.providers;
  const evidenceIds = dispatch.canonical.integrity.evidence.map(item => item.id);
  return {
    httpStatus: 422,
    payload: {
      correlationId,
      symbol,
      assetType,
      assetId: dispatch.asset.assetId,
      modelRegistry: modelRegistryView(dispatch.model),
      ...dispatch.canonical,
      providers,
      evidenceIds,
      provenance: dispatch.canonical.integrity.evidence,
      lineage: lineage({
        correlationId,
        assetId: dispatch.asset.assetId,
        assetClass: assetType,
        model: dispatch.model,
        providers,
        evidenceIds,
      }),
      reason: reason ?? ('reason' in dispatch ? dispatch.reason : dispatch.canonical.integrity.reason),
    },
  };
}

export async function evaluateVerifiedCatalogSymbol(
  symbolInput: string,
  correlationId: string,
): Promise<VerifiedCatalogEvaluation> {
  const symbol = symbolInput.toUpperCase().trim();
  const asset = getAssetCatalogEntry(symbol);
  if (!asset) {
    return { httpStatus: 404, payload: { correlationId, symbol, status: 'ASSET_NOT_FOUND', score: null, final_score: null } };
  }

  try {
    if (asset.type === 'commodity') {
      const evidence = await getTwelveDataCommodityEvidence(symbol, 90);
      const dispatch = await dispatchCanonicalScore({
        symbol,
        name: asset.name,
        assetClass: 'commodity',
        subtype: asset.subtype,
        source: 'catalog',
        execution: { kind: 'commodity-evidence', evidence },
      });
      if (dispatch.status !== 'DISPATCHED') return failurePayload(correlationId, symbol, asset.type, dispatch);

      const result = dispatch.assessment;
      const canonical = dispatch.canonical;
      const providers = canonical.integrity.providers;
      const evidenceIds = canonical.integrity.evidence.map(item => item.id);
      return {
        httpStatus: canonical.status === 'READY' ? 200 : 422,
        payload: {
          correlationId,
          symbol,
          assetType: asset.type,
          assetId: dispatch.asset.assetId,
          modelRegistry: modelRegistryView(dispatch.model),
          ...canonical,
          scoreSemantic: result.scoreSemantic,
          contractVersion: result.contractVersion,
          contractStatus: result.contractStatus,
          providers,
          evidenceIds,
          usedFactors: result.usedFactors,
          missingFactors: result.missingFactors,
          factors: result.factors,
          reasoning: result.reasoning,
          provenance: canonical.integrity.evidence,
          lineage: lineage({
            correlationId,
            assetId: dispatch.asset.assetId,
            assetClass: asset.type,
            model: dispatch.model,
            providers,
            evidenceIds,
            extra: {
              marketEvidenceVersion: evidence.version,
              providerSymbol: evidence.providerSymbol,
              providerName: evidence.providerName,
            },
          }),
        },
      };
    }

    if (asset.type === 'bond') {
      const mapping = await resolveSovereignBondProviderMapping(symbol);
      if (!mapping) {
        const dispatch = await dispatchCanonicalScore({
          symbol,
          name: asset.name,
          assetClass: 'bond',
          subtype: asset.subtype,
          instrumentKind: asset.instrumentKind,
          source: 'catalog',
        });
        return failurePayload(
          correlationId,
          symbol,
          asset.type,
          dispatch,
          'Kein explizit freigegebenes oder durch den EODHD-GBOND-Katalog bestätigtes Sovereign-Benchmark-Mapping vorhanden. Einzelanleihen bleiben nach ADR-0022 gesperrt.',
        );
      }
      const evidence = await getEodhdBondEvidence(mapping.providerSymbol, 90);
      const dispatch = await dispatchCanonicalScore({
        symbol,
        name: asset.name,
        assetClass: 'bond',
        subtype: asset.subtype,
        instrumentKind: asset.instrumentKind,
        source: 'catalog',
        execution: { kind: 'sovereign-benchmark-evidence', evidence },
      });
      if (dispatch.status !== 'DISPATCHED') return failurePayload(correlationId, symbol, asset.type, dispatch);

      const result = dispatch.assessment;
      const canonical = dispatch.canonical;
      const providers = canonical.integrity.providers;
      const evidenceIds = canonical.integrity.evidence.map(item => item.id);
      return {
        httpStatus: canonical.status === 'READY' ? 200 : 422,
        payload: {
          correlationId,
          symbol,
          assetType: asset.type,
          assetId: dispatch.asset.assetId,
          modelRegistry: modelRegistryView(dispatch.model),
          ...canonical,
          scoreSemantic: result.scoreSemantic,
          contractVersion: result.contractVersion,
          contractStatus: result.contractStatus,
          providers,
          evidenceIds,
          usedFactors: result.usedFactors,
          missingFactors: result.missingFactors,
          factors: result.factors,
          reasoning: result.reasoning,
          provenance: canonical.integrity.evidence,
          lineage: lineage({
            correlationId,
            assetId: dispatch.asset.assetId,
            assetClass: asset.type,
            model: dispatch.model,
            providers,
            evidenceIds,
            extra: {
              providerMappingVersion: mapping.version,
              providerMappingMode: mapping.mappingMode,
              providerSymbol: mapping.providerSymbol,
              individualBondScoringEligible: false,
            },
          }),
        },
      };
    }

    if (asset.type !== 'stock' && asset.type !== 'forex' && asset.type !== 'index') {
      return {
        httpStatus: 400,
        payload: {
          correlationId,
          symbol,
          assetType: asset.type,
          status: 'UNSUPPORTED_ASSET_CLASS',
          score: null,
          final_score: null,
          reason: 'Für diese Assetklasse ist kein freigegebener Registry-Evidence-Scoring-Contract aktiv.',
        },
      };
    }

    let inputs;
    if (asset.type === 'stock') {
      await ensureFundamentalsFresh(symbol);
      inputs = await generateTraditionalAssetInputs(symbol, 'stock', getCachedFundamentals(symbol));
    } else if (asset.type === 'forex') {
      inputs = await generateTraditionalAssetInputs(symbol, 'forex');
    } else {
      const evidence = await getVerifiedIndexHistory(symbol, 45);
      const dispatchWithoutEvidence = !evidence
        ? await dispatchCanonicalScore({ symbol, name: asset.name, assetClass: 'index', subtype: asset.subtype, source: 'catalog' })
        : null;
      if (!evidence && dispatchWithoutEvidence) {
        return failurePayload(
          correlationId,
          symbol,
          asset.type,
          dispatchWithoutEvidence,
          'Weder das freigegebene FMP-Mapping noch ein durch Provider-Metadaten verifiziertes Twelve-Data-Mapping lieferte ausreichende reale Index-Historie.',
        );
      }
      inputs = buildIndexScoringInputsFromEvidence(evidence!);
    }

    const dispatch = await dispatchCanonicalScore({
      symbol,
      name: asset.name,
      assetClass: asset.type,
      subtype: asset.subtype,
      source: 'catalog',
      execution: { kind: 'traditional', inputs },
    });
    if (dispatch.status !== 'DISPATCHED') return failurePayload(correlationId, symbol, asset.type, dispatch);

    const result = dispatch.assessment;
    const canonical = dispatch.canonical;
    const providers = canonical.integrity.providers;
    const evidenceIds = canonical.integrity.evidence.map(item => item.id);
    return {
      httpStatus: canonical.status === 'READY' ? 200 : 422,
      payload: {
        correlationId,
        symbol,
        assetType: asset.type,
        assetId: dispatch.asset.assetId,
        modelRegistry: modelRegistryView(dispatch.model),
        ...canonical,
        providers,
        evidenceIds,
        usedFactors: result.usedFactors,
        missingFactors: result.missingFactors,
        reasoning: result.reasoning,
        provenance: result.provenance,
        lineage: lineage({
          correlationId,
          assetId: dispatch.asset.assetId,
          assetClass: asset.type,
          model: dispatch.model,
          providers,
          evidenceIds,
          extra: { featureVersion: canonical.integrity.featureVersion, scoringVersion: canonical.integrity.scoringVersion },
        }),
      },
    };
  } catch (error) {
    return {
      httpStatus: 503,
      payload: {
        correlationId,
        symbol,
        assetType: asset.type,
        status: 'SCORE_NOT_COMPUTABLE',
        score: null,
        final_score: null,
        reason: error instanceof Error ? error.message : String(error),
        providers: [],
        evidenceIds: [],
        provenance: [],
        lineage: null,
      },
    };
  }
}
