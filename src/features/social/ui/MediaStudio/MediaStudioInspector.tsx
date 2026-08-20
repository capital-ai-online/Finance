import React from 'react';
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import type { MediaLayer, MediaProjectV2 } from '../../../../platform/SocialMediaEngine/Contracts/MediaProject';
import { Button, Input } from '../../../../shared/ui';

interface MediaStudioInspectorProps {
  project: MediaProjectV2;
  layer: MediaLayer | null;
  onStartFrameChange: (frame: number) => void;
  onDurationFramesChange: (frames: number) => void;
  onNudge: (frames: number) => void;
  onResize: (frames: number) => void;
  onEnabledChange: (enabled: boolean) => void;
  onTextChange: (field: 'title' | 'body' | 'kicker' | 'disclaimer' | 'text', value: string) => void;
}

function TextAreaField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (value: string) => void;
}) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/45">
      {label}
      <textarea
        key={`${label}:${value}`}
        defaultValue={value}
        onBlur={(event) => {
          if (event.currentTarget.value !== value) onCommit(event.currentTarget.value);
        }}
        rows={3}
        className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-aif-gold-DEFAULT focus:ring-2 focus:ring-aif-gold-DEFAULT/25"
      />
    </label>
  );
}

export function MediaStudioInspector({
  project,
  layer,
  onStartFrameChange,
  onDurationFramesChange,
  onNudge,
  onResize,
  onEnabledChange,
  onTextChange,
}: MediaStudioInspectorProps) {
  if (!layer) {
    return (
      <aside aria-labelledby="media-studio-inspector-heading" className="rounded-xl border border-white/10 bg-black/25 p-4">
        <h2 id="media-studio-inspector-heading" className="text-sm font-black uppercase tracking-[0.18em] text-white">
          Inspector
        </h2>
        <p className="mt-4 text-xs leading-relaxed text-white/45">Select a timeline layer to edit its validated properties.</p>
      </aside>
    );
  }

  const framesPerSecond = Math.max(1, Math.round(project.timebase.numerator / project.timebase.denominator));

  return (
    <aside aria-labelledby="media-studio-inspector-heading" className="space-y-5 rounded-xl border border-white/10 bg-black/25 p-4">
      <div>
        <h2 id="media-studio-inspector-heading" className="text-sm font-black uppercase tracking-[0.18em] text-white">
          Inspector
        </h2>
        <p className="mt-1 truncate font-mono text-[10px] text-aif-gold-DEFAULT">{layer.id}</p>
      </div>

      <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3">
        <span className="text-xs font-medium text-white/70">Layer enabled</span>
        <input
          type="checkbox"
          checked={layer.enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          className="h-5 w-5 accent-amber-300"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-white/45">
          Start frame
          <Input
            key={`start:${layer.id}:${layer.range.startFrame}`}
            type="number"
            min={0}
            defaultValue={layer.range.startFrame}
            onBlur={(event) => onStartFrameChange(Number(event.currentTarget.value))}
            className="mt-1.5 font-mono"
          />
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wider text-white/45">
          Duration
          <Input
            key={`duration:${layer.id}:${layer.range.durationFrames}`}
            type="number"
            min={1}
            defaultValue={layer.range.durationFrames}
            onBlur={(event) => onDurationFramesChange(Number(event.currentTarget.value))}
            className="mt-1.5 font-mono"
          />
        </label>
      </div>

      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/45">Keyboard/pointer alternatives</div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={() => onNudge(-1)} aria-label="Move layer one frame left">
            <ChevronLeft size={14} /> 1f
          </Button>
          <Button size="sm" onClick={() => onNudge(1)} aria-label="Move layer one frame right">
            1f <ChevronRight size={14} />
          </Button>
          <Button size="sm" onClick={() => onNudge(-framesPerSecond)}>
            <ChevronLeft size={14} /> 1s
          </Button>
          <Button size="sm" onClick={() => onNudge(framesPerSecond)}>
            1s <ChevronRight size={14} />
          </Button>
          <Button size="sm" onClick={() => onResize(-framesPerSecond)} aria-label="Shorten layer by one second">
            <Minus size={14} /> 1s
          </Button>
          <Button size="sm" onClick={() => onResize(framesPerSecond)} aria-label="Extend layer by one second">
            <Plus size={14} /> 1s
          </Button>
        </div>
      </div>

      {layer.kind === 'scene' && (
        <div className="space-y-4 border-t border-white/10 pt-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/45">
            Title
            <Input
              key={`title:${layer.id}:${layer.title}`}
              defaultValue={layer.title}
              onBlur={(event) => {
                if (event.currentTarget.value !== layer.title) onTextChange('title', event.currentTarget.value);
              }}
              className="mt-1.5"
            />
          </label>
          <TextAreaField label="Body" value={layer.body} onCommit={(value) => onTextChange('body', value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/45">
            Kicker
            <Input
              key={`kicker:${layer.id}:${layer.kicker ?? ''}`}
              defaultValue={layer.kicker ?? ''}
              onBlur={(event) => onTextChange('kicker', event.currentTarget.value)}
              className="mt-1.5"
            />
          </label>
          <TextAreaField
            label="Disclaimer"
            value={layer.disclaimer ?? ''}
            onCommit={(value) => onTextChange('disclaimer', value)}
          />
        </div>
      )}

      {(layer.kind === 'text' || layer.kind === 'caption') && (
        <div className="border-t border-white/10 pt-4">
          <TextAreaField label="Text" value={layer.text} onCommit={(value) => onTextChange('text', value)} />
        </div>
      )}
    </aside>
  );
}
