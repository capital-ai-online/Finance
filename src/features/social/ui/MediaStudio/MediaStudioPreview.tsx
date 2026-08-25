import React, { useMemo } from 'react';
import type { MediaProjectV2 } from '../../../../platform/SocialMediaEngine/Contracts/MediaProject';

interface MediaStudioPreviewProps {
  project: MediaProjectV2;
  playheadFrame: number;
}

export function MediaStudioPreview({ project, playheadFrame }: MediaStudioPreviewProps) {
  const activeLayers = useMemo(
    () =>
      project.tracks
        .filter((track) => track.enabled)
        .flatMap((track) => track.layers)
        .filter(
          (layer) =>
            layer.enabled &&
            playheadFrame >= layer.range.startFrame &&
            playheadFrame < layer.range.startFrame + layer.range.durationFrames,
        ),
    [playheadFrame, project],
  );

  const scene = activeLayers.find((layer) => layer.kind === 'scene');
  const textLayers = activeLayers.filter((layer) => layer.kind === 'text');
  const caption = activeLayers.find((layer) => layer.kind === 'caption');

  return (
    <section aria-labelledby="media-studio-preview-heading" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 id="media-studio-preview-heading" className="font-display text-sm font-black uppercase tracking-[0.18em] text-text-primary">
            Preview
          </h2>
          <p className="text-[11px] text-text-secondary">
            Deterministic DOM preview · final render remains outside the browser.
          </p>
        </div>
        <span className="rounded-md border border-border bg-surface/60 px-2 py-1 font-mono text-[10px] text-text-secondary">
          {project.canvas.width}×{project.canvas.height} · {project.canvas.aspectRatio}
        </span>
      </div>

      <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-background/70 p-5">
        <div
          className="relative max-h-[62vh] w-full max-w-4xl overflow-hidden rounded-xl border border-brand-primary/25 bg-background"
          style={{
            aspectRatio: `${project.canvas.width} / ${project.canvas.height}`,
            boxShadow: '0 0 60px color-mix(in srgb, var(--color-brand-primary) 8%, transparent)',
          }}
          aria-label={`Media preview at frame ${playheadFrame}`}
        >
          <div
            className="absolute inset-0"
            style={{
              background: [
                'radial-gradient(circle at 18% 22%, color-mix(in srgb, var(--color-brand-primary) 16%, transparent), transparent 28%)',
                'radial-gradient(circle at 82% 72%, color-mix(in srgb, var(--color-brand-cyan) 10%, transparent), transparent 26%)',
                'linear-gradient(135deg, color-mix(in srgb, var(--color-foreground) 2.5%, transparent), transparent 55%)',
              ].join(','),
            }}
          />
          <div
            className="absolute left-[12%] top-[16%] h-2.5 w-2.5 rounded-full border border-brand-primary/60 bg-brand-primary/20"
            style={{ boxShadow: '0 0 18px color-mix(in srgb, var(--color-brand-primary) 55%, transparent)' }}
          />
          <div
            className="absolute left-[28%] top-[30%] h-1.5 w-1.5 rounded-full bg-brand-cyan/60"
            style={{ boxShadow: '0 0 14px color-mix(in srgb, var(--color-brand-cyan) 55%, transparent)' }}
          />
          <div
            className="absolute right-[19%] top-[23%] h-2 w-2 rounded-full bg-brand-accent/60"
            style={{ boxShadow: '0 0 14px color-mix(in srgb, var(--color-brand-accent) 50%, transparent)' }}
          />
          <div className="absolute left-[12.5%] top-[17.5%] h-px w-[23%] origin-left rotate-[22deg] bg-gradient-to-r from-brand-primary/45 to-brand-cyan/20" />
          <div className="absolute right-[19.5%] top-[24%] h-px w-[30%] origin-right -rotate-[18deg] bg-gradient-to-l from-brand-accent/35 to-transparent" />

          <div className="relative z-10 flex h-full flex-col justify-between p-[7%]">
            <div>
              <p className="font-mono text-[clamp(9px,1vw,13px)] font-black uppercase tracking-[0.28em] text-brand-primary">
                {scene?.kind === 'scene' ? scene.kicker ?? 'CAPITAL-AI' : 'CAPITAL-AI'}
              </p>
              <div className="mt-4 h-px w-24 bg-gradient-to-r from-brand-primary/80 to-transparent" />
            </div>

            <div className="max-w-[86%]">
              <h3 className="font-display text-[clamp(20px,4vw,58px)] font-black leading-[0.95] tracking-[-0.03em] text-text-primary">
                {scene?.kind === 'scene' ? scene.title : project.title}
              </h3>
              {scene?.kind === 'scene' && (
                <p className="mt-5 max-w-3xl text-[clamp(10px,1.35vw,20px)] font-medium leading-relaxed text-text-primary/70">
                  {scene.body}
                </p>
              )}
              {textLayers.map((layer) =>
                layer.kind === 'text' ? (
                  <p key={layer.id} className="mt-3 text-[clamp(10px,1.2vw,18px)] text-text-primary/80">
                    {layer.text}
                  </p>
                ) : null,
              )}
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="max-w-[78%]">
                {scene?.kind === 'scene' && scene.disclaimer && (
                  <p className="text-[clamp(7px,0.72vw,10px)] leading-relaxed text-text-secondary">
                    {scene.disclaimer}
                  </p>
                )}
                {caption?.kind === 'caption' && (
                  <p className="mt-2 rounded bg-background/80 px-2 py-1 text-[clamp(9px,1vw,13px)] text-text-primary/85">
                    {caption.text}
                  </p>
                )}
              </div>
              <div className="font-mono text-[clamp(7px,0.8vw,11px)] font-bold uppercase tracking-[0.2em] text-brand-cyan/60">
                Draft · offline
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
