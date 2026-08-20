import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Pause,
  Undo2,
  Play,
  Redo2,
  RotateCcw,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  type MediaProjectV2,
} from '../../../../platform/SocialMediaEngine/Contracts/MediaProject';
import {
  type MediaProjectValidationError,
  validateMediaProjectV2,
} from '../../../../platform/SocialMediaEngine/Contracts/MediaProjectValidation';
import {
  moveMediaLayerByFrames,
  resizeMediaLayerByFrames,
  selectMediaLayer,
  setMediaLayerDurationFrames,
  setMediaLayerEnabled,
  setMediaLayerStartFrame,
  setMediaLayerText,
  setMediaProjectCanvasPreset,
  type MediaProjectEditResult,
  type MediaStudioCanvasPreset,
} from '../../../../platform/SocialMediaEngine/Editing/MediaProjectEditing';
import { createCapitalAiMediaStudioProject } from '../../../../platform/SocialMediaEngine/Editing/MediaStudioTemplates';
import {
  SocialMediaGeneratorService,
  type SocialMediaAccessStatus,
} from '../../../../platform/SocialMediaEngine/SocialMediaGeneratorService';
import { Button, Card, StatusBadge } from '../../../../shared/ui';
import { MediaStudioInspector } from './MediaStudioInspector';
import { MediaStudioPreview } from './MediaStudioPreview';
import { MediaStudioTimeline } from './MediaStudioTimeline';

const MAX_IMPORT_BYTES = 1_000_000;
const HISTORY_LIMIT = 50;

function firstLayerId(project: MediaProjectV2): string | null {
  return project.tracks.flatMap((track) => track.layers)[0]?.id ?? null;
}

function formatAccessReason(access: SocialMediaAccessStatus): string {
  if (access.allowed) return '';
  if (access.reason === 'unauthenticated') return 'Authentication is required for the Media Studio.';
  if (access.reason === 'insufficient-tier') return 'Media Studio access follows the existing Owner/Founder social-media entitlement.';
  return 'Media Studio access could not be verified. The feature remains fail-closed.';
}

function ValidationPanel({
  validationErrors,
  editErrors,
}: {
  validationErrors: MediaProjectValidationError[];
  editErrors: MediaProjectValidationError[];
}) {
  const errors = editErrors.length > 0 ? editErrors : validationErrors;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Validation</h2>
          <p className="mt-1 text-[11px] text-white/45">
            Structural and semantic trust rules remain authoritative outside the React UI.
          </p>
        </div>
        <StatusBadge
          status={errors.length === 0 ? 'READY' : 'REJECT'}
          label={errors.length === 0 ? 'VALID' : `${errors.length} ISSUE${errors.length === 1 ? '' : 'S'}`}
        />
      </div>

      {errors.length === 0 ? (
        <p className="mt-4 text-xs leading-relaxed text-emerald-200/70">
          The current project satisfies MediaProject v2 invariants and remains draft-only.
        </p>
      ) : (
        <ul className="mt-4 max-h-44 space-y-2 overflow-y-auto">
          {errors.slice(0, 12).map((error, index) => (
            <li key={`${error.code}:${error.path}:${index}`} className="rounded-lg border border-red-400/15 bg-red-500/[0.06] p-2.5">
              <div className="font-mono text-[10px] font-bold text-red-200">{error.code}</div>
              <div className="mt-0.5 font-mono text-[9px] text-white/35">{error.path}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-white/60">{error.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function MediaStudio() {
  const [access, setAccess] = useState<SocialMediaAccessStatus | null>(null);
  const [project, setProject] = useState<MediaProjectV2>(() => createCapitalAiMediaStudioProject());
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(() => firstLayerId(project));
  const [playheadFrame, setPlayheadFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [past, setPast] = useState<MediaProjectV2[]>([]);
  const [future, setFuture] = useState<MediaProjectV2[]>([]);
  const [editErrors, setEditErrors] = useState<MediaProjectValidationError[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    SocialMediaGeneratorService.checkAccess()
      .then((status) => {
        if (active) setAccess(status);
      })
      .catch(() => {
        if (active) setAccess({ allowed: false, reason: 'internal-error' });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!playing) return undefined;

    const fps = project.timebase.numerator / project.timebase.denominator;
    const framesPerTick = Math.max(1, Math.round(fps / 10));
    const timer = window.setInterval(() => {
      setPlayheadFrame((current) => {
        const next = current + framesPerTick;
        if (next >= project.durationFrames) {
          setPlaying(false);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [playing, project.durationFrames, project.timebase.denominator, project.timebase.numerator]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editingText = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (editingText) return;

      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (command && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
      if (event.code === 'Space') {
        event.preventDefault();
        setPlaying((value) => !value);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const validation = useMemo(() => validateMediaProjectV2(project), [project]);
  const selectedLayer = useMemo(() => selectMediaLayer(project, selectedLayerId), [project, selectedLayerId]);

  const commitProject = (nextProject: MediaProjectV2) => {
    setPast((history) => [...history.slice(-(HISTORY_LIMIT - 1)), structuredClone(project)]);
    setFuture([]);
    setProject(nextProject);
    setPlayheadFrame((frame) => Math.min(frame, Math.max(0, nextProject.durationFrames - 1)));
    setEditErrors([]);
    setImportMessage(null);
  };

  const applyEdit = (result: MediaProjectEditResult) => {
    if ('errors' in result) {
      setEditErrors(result.errors);
      return;
    }
    commitProject(result.project);
  };

  const undo = () => {
    setPast((history) => {
      const previous = history.at(-1);
      if (!previous) return history;
      setFuture((next) => [structuredClone(project), ...next].slice(0, HISTORY_LIMIT));
      setProject(previous);
      setEditErrors([]);
      setPlayheadFrame((frame) => Math.min(frame, Math.max(0, previous.durationFrames - 1)));
      return history.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((history) => {
      const next = history[0];
      if (!next) return history;
      setPast((previous) => [...previous.slice(-(HISTORY_LIMIT - 1)), structuredClone(project)]);
      setProject(next);
      setEditErrors([]);
      setPlayheadFrame((frame) => Math.min(frame, Math.max(0, next.durationFrames - 1)));
      return history.slice(1);
    });
  };

  const resetProject = () => {
    const next = createCapitalAiMediaStudioProject({ aspectRatio: project.canvas.aspectRatio === 'custom' ? '16:9' : project.canvas.aspectRatio });
    commitProject(next);
    setSelectedLayerId(firstLayerId(next));
    setPlayheadFrame(0);
    setPlaying(false);
  };

  const exportProject = () => {
    const currentValidation = validateMediaProjectV2(project);
    if (!currentValidation.ok) {
      setEditErrors(currentValidation.errors);
      return;
    }

    const blob = new Blob([`${JSON.stringify(project, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.slug}.media-project-v2.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const importProject = async (file: File | undefined) => {
    if (!file) return;
    setImportMessage(null);

    if (file.size > MAX_IMPORT_BYTES) {
      setImportMessage(`Import rejected: file exceeds ${MAX_IMPORT_BYTES.toLocaleString()} bytes.`);
      return;
    }

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const result = validateMediaProjectV2(parsed);
      if (!result.ok) {
        setEditErrors(result.errors);
        setImportMessage('Import rejected by MediaProject v2 validation.');
        return;
      }
      const next = parsed as MediaProjectV2;
      commitProject(next);
      setSelectedLayerId(firstLayerId(next));
      setPlayheadFrame(0);
      setImportMessage('Validated MediaProject imported.');
    } catch {
      setImportMessage('Import rejected: invalid JSON.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (access === null) {
    return (
      <Card elevated className="mx-auto max-w-2xl text-center">
        <StatusBadge status="LOADING" label="VERIFYING ACCESS" size="md" />
        <p className="mt-4 text-sm text-white/55">Media Studio entitlement is being checked against the existing SocialMediaEngine authority.</p>
      </Card>
    );
  }

  if (!access.allowed) {
    return (
      <Card elevated className="mx-auto max-w-2xl text-center">
        <StatusBadge status="REJECT" label="ACCESS DENIED" size="md" />
        <h2 className="mt-4 text-lg font-black text-white">Media Studio unavailable</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/55">{formatAccessReason(access)}</p>
      </Card>
    );
  }

  const aspectPreset = project.canvas.aspectRatio === 'custom' ? null : project.canvas.aspectRatio;

  return (
    <div className="space-y-5">
      <Card elevated className="p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">Media Studio MVP</h1>
              <StatusBadge status={validation.ok ? 'READY' : 'REJECT'} label={validation.ok ? 'DRAFT VALID' : 'DRAFT INVALID'} />
              <StatusBadge status="OBSERVE" label="PUBLISH READY = FALSE" />
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/50">
              Non-destructive, frame-accurate MediaProject v2 editing. No upload, publishing, provider generation or remote asset trust is granted here.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={undo} disabled={past.length === 0} title="Undo (Ctrl/Cmd+Z)">
              <Undo2 size={14} /> Undo
            </Button>
            <Button size="sm" onClick={redo} disabled={future.length === 0} title="Redo (Ctrl/Cmd+Y)">
              <Redo2 size={14} /> Redo
            </Button>
            <Button size="sm" onClick={resetProject}>
              <RotateCcw size={14} /> Reset
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload size={14} /> Import JSON
            </Button>
            <Button size="sm" variant="primary" onClick={exportProject}>
              <Download size={14} /> Export JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => void importProject(event.target.files?.[0])}
            />
          </div>
        </div>

        {importMessage && (
          <div role="status" className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-white/60">
            {importMessage}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Canvas</span>
          {(['16:9', '1:1', '9:16'] as const).map((preset) => (
            <Button
              key={preset}
              size="sm"
              variant={aspectPreset === preset ? 'primary' : 'secondary'}
              onClick={() => applyEdit(setMediaProjectCanvasPreset(project, preset as MediaStudioCanvasPreset))}
              aria-pressed={aspectPreset === preset}
            >
              {preset}
            </Button>
          ))}

          <span className="ml-4 mr-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Preview</span>
          <Button size="sm" onClick={() => setPlaying((value) => !value)}>
            {playing ? <Pause size={14} /> : <Play size={14} />}
            {playing ? 'Pause' : 'Play'}
          </Button>

          <span className="ml-4 mr-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Zoom</span>
          <Button size="sm" onClick={() => setZoom((value) => Math.max(0.5, Number((value - 0.25).toFixed(2))))} disabled={zoom <= 0.5}>
            <ZoomOut size={14} />
          </Button>
          <span className="min-w-12 text-center font-mono text-[10px] text-white/55">{Math.round(zoom * 100)}%</span>
          <Button size="sm" onClick={() => setZoom((value) => Math.min(2, Number((value + 0.25).toFixed(2))))} disabled={zoom >= 2}>
            <ZoomIn size={14} />
          </Button>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="min-w-0 p-4">
          <MediaStudioPreview project={project} playheadFrame={playheadFrame} />
        </Card>

        <MediaStudioInspector
          project={project}
          layer={selectedLayer}
          onStartFrameChange={(frame) => selectedLayerId && applyEdit(setMediaLayerStartFrame(project, selectedLayerId, frame))}
          onDurationFramesChange={(frames) => selectedLayerId && applyEdit(setMediaLayerDurationFrames(project, selectedLayerId, frames))}
          onNudge={(frames) => selectedLayerId && applyEdit(moveMediaLayerByFrames(project, selectedLayerId, frames))}
          onResize={(frames) => selectedLayerId && applyEdit(resizeMediaLayerByFrames(project, selectedLayerId, frames))}
          onEnabledChange={(enabled) => selectedLayerId && applyEdit(setMediaLayerEnabled(project, selectedLayerId, enabled))}
          onTextChange={(field, value) => selectedLayerId && applyEdit(setMediaLayerText(project, selectedLayerId, field, value))}
        />
      </div>

      <Card className="p-4">
        <MediaStudioTimeline
          project={project}
          playheadFrame={playheadFrame}
          selectedLayerId={selectedLayerId}
          zoom={zoom}
          onSelectLayer={setSelectedLayerId}
          onPlayheadChange={(frame) => {
            setPlayheadFrame(frame);
            setPlaying(false);
          }}
        />
      </Card>

      <ValidationPanel validationErrors={validation.errors} editErrors={editErrors} />
    </div>
  );
}
