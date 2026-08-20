import React, { useMemo } from 'react';
import { framesToSeconds } from '../../../../platform/SocialMediaEngine/Editing/MediaProjectEditing';
import type { MediaProjectV2 } from '../../../../platform/SocialMediaEngine/Contracts/MediaProject';

interface MediaStudioTimelineProps {
  project: MediaProjectV2;
  playheadFrame: number;
  selectedLayerId: string | null;
  zoom: number;
  onSelectLayer: (layerId: string) => void;
  onPlayheadChange: (frame: number) => void;
}

const PIXELS_PER_SECOND = 60;

export function MediaStudioTimeline({
  project,
  playheadFrame,
  selectedLayerId,
  zoom,
  onSelectLayer,
  onPlayheadChange,
}: MediaStudioTimelineProps) {
  const durationSeconds = framesToSeconds(project, project.durationFrames);
  const timelineWidth = Math.max(780, durationSeconds * PIXELS_PER_SECOND * zoom);
  const playheadLeft = framesToSeconds(project, playheadFrame) * PIXELS_PER_SECOND * zoom;

  const rulerMarks = useMemo(() => {
    const step = durationSeconds <= 30 ? 5 : durationSeconds <= 120 ? 10 : 30;
    const count = Math.floor(durationSeconds / step);
    return Array.from({ length: count + 1 }, (_, index) => index * step);
  }, [durationSeconds]);

  return (
    <section aria-labelledby="media-studio-timeline-heading">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 id="media-studio-timeline-heading" className="text-sm font-black uppercase tracking-[0.18em] text-white">
            Timeline
          </h2>
          <p className="text-[11px] text-white/45">
            Integer-frame sequencing. Editing controls never bypass MediaProject validation.
          </p>
        </div>
        <span className="font-mono text-[10px] text-white/45">
          {project.durationFrames}f · {durationSeconds.toFixed(2)}s
        </span>
      </div>

      <label className="mb-3 block text-[10px] font-bold uppercase tracking-wider text-white/45">
        Playhead
        <input
          className="mt-2 w-full accent-amber-300"
          type="range"
          min={0}
          max={Math.max(0, project.durationFrames - 1)}
          value={Math.min(playheadFrame, project.durationFrames - 1)}
          onChange={(event) => onPlayheadChange(Number(event.target.value))}
          aria-valuetext={`${framesToSeconds(project, playheadFrame).toFixed(2)} seconds`}
        />
      </label>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <div className="grid grid-cols-[9rem_minmax(0,1fr)] border-b border-white/10 bg-white/[0.025]">
          <div className="border-r border-white/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white/40">
            Tracks
          </div>
          <div className="overflow-x-auto">
            <div className="relative h-9" style={{ width: timelineWidth }}>
              {rulerMarks.map((seconds) => (
                <div
                  key={seconds}
                  className="absolute inset-y-0 border-l border-white/10"
                  style={{ left: seconds * PIXELS_PER_SECOND * zoom }}
                >
                  <span className="ml-1 font-mono text-[9px] text-white/35">{seconds}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {project.tracks.map((track) => (
          <div key={track.id} className="grid grid-cols-[9rem_minmax(0,1fr)] border-b border-white/5 last:border-b-0">
            <div className="border-r border-white/10 px-3 py-3">
              <div className="truncate text-[11px] font-bold text-white/75">{track.name ?? track.id}</div>
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-white/35">{track.kind}</div>
            </div>
            <div className="overflow-x-auto">
              <div className="relative h-14" style={{ width: timelineWidth }}>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 z-20 w-px bg-aif-gold-DEFAULT shadow-[0_0_8px_rgba(245,196,83,0.65)]"
                  style={{ left: playheadLeft }}
                />
                {track.layers.map((layer) => {
                  const left = framesToSeconds(project, layer.range.startFrame) * PIXELS_PER_SECOND * zoom;
                  const width = Math.max(
                    32,
                    framesToSeconds(project, layer.range.durationFrames) * PIXELS_PER_SECOND * zoom,
                  );
                  const selected = selectedLayerId === layer.id;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => onSelectLayer(layer.id)}
                      aria-pressed={selected}
                      aria-label={`${layer.name ?? layer.id}, ${layer.kind}, starts at frame ${layer.range.startFrame}, duration ${layer.range.durationFrames} frames`}
                      className={`absolute top-2 h-10 overflow-hidden rounded-md border px-2 text-left transition ${
                        selected
                          ? 'border-aif-gold-DEFAULT bg-aif-gold-DEFAULT/16 text-white shadow-[0_0_18px_rgba(245,196,83,0.13)]'
                          : 'border-white/10 bg-white/[0.055] text-white/65 hover:border-white/25 hover:bg-white/[0.08]'
                      } ${layer.enabled ? '' : 'opacity-40'}`}
                      style={{ left, width }}
                    >
                      <span className="block truncate text-[10px] font-bold">{layer.name ?? layer.id}</span>
                      <span className="block font-mono text-[8px] uppercase tracking-wider text-white/35">{layer.kind}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
