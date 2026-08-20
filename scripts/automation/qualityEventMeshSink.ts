import type {
  QualityCenterEventName,
  QualityEventSink,
} from '../../src/platform/Quality/Contracts/QualityCenterContract';
import { eventMeshBus } from '../../src/platform/EventMesh/Core/EventBus';
import { bootstrapEventMesh, isBootstrapped } from '../../src/platform/EventMesh/Services/EventMeshService';

export const QUALITY_EVENT_MESH_SINK_VERSION = 'quality-event-mesh-sink/1.0.0' as const;
const SOURCE_COMPONENT = 'src/platform/Quality';

export class EventMeshQualityEventSink implements QualityEventSink {
  publish(eventName: QualityCenterEventName, payload: Readonly<Record<string, unknown>>): void {
    if (!isBootstrapped()) bootstrapEventMesh(eventMeshBus);
    eventMeshBus.publish(eventName, { ...payload }, {
      sourceComponent: SOURCE_COMPONENT,
      essReferences: ['ESS-0005', 'ESS-0013'],
      adrReferences: ['ADR-0018', 'ADR-0096'],
    });
  }
}
