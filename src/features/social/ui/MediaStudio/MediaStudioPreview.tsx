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
          <h2 id="media-studio-preview-heading" className="text-sm font-black uppercase tracking-[0.18em] text-white">
            Preview
          </h2>
          <p className="text-[11px] text-white/45">
            Deterministic DOM preview · final render remains outside the browser.
          </p>
        </div>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-white/55">
          {project.canvas.width}×{project.canvas.height} · {project.canvas.aspectRatio}
        </span>
      </div>

      <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-white/10 bg-black/40 p-5">
        <div
          className="relative max-h-[62vh] w-full max-w-4xl overflow-hidden rounded-xl border border-aif-gold-DEFAULT/25 bg-[#050608] shadow-[0_0_60px_rgba(245,196,83,0.08)]"
          style={{ aspectRatio: `${project.canvas.width} / ${project.canvas.height}` }}
          aria-label={`Media preview at frame ${playheadFrame}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(245,196,83,0.16),transparent_28%),radial-gradient(circle_at_82%_72%,rgba(13,221,221,0.10),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.025),transparent_55%)]" />
          <div className="absolute left-[12%] top-[16%] h-2.5 w-2.5 rounded-full border border-aif-gold-DEFAULT/60 bg-aif-gold-DEFAULT/20 shadow-[0_0_18px_rgba(245,196,83,0.55)]" />
          <div className="absolute left-[28%] top-[30%] h-1.5 w-1.5 rounded-full bg-cyan-300/60 shadow-[0_0_14px_rgba(13,221,221,0.55)]" />
          <div className="absolute right-[19%] top-[23%] h-2 w-2 rounded-full bg-purple-300/60 shadow-[0_0_14px_rgba(168,85,247,0.5)]" />
          <div className="absolute left-[12.5%] top-[17.5%] h-px w-[23%] origin-left rotate-[22deg] bg-gradient-to-r from-aif-gold-DEFAULT/45 to-cyan-300/20" />
          <div className="absolute right-[19.5%] top-[24%] h-px w-[30%] origin-right -rotate-[18deg] bg-gradient-to-l from-purple-300/35 to-transparent" />

          <div className="relative z-10 flex h-full flex-col justify-between p-[7%]">
            <div>
              <p className="font-mono text-[clamp(9px,1vw,13px)] font-black uppercase tracking-[0.28em] text-aif-gold-DEFAULT">
                {scene?.kind === 'scene' ? scene.kicker ?? 'CAPITAL-AI' : 'CAPITAL-AI'}
              </p>
              <div className="mt-4 h-px w-24 bg-gradient-to-r from-aif-gold-DEFAULT/80 to-transparent" />
            </div>

            <div className="max-w-[86%]">
              <h3 className="text-[clamp(20px,4vw,58px)] font-black leading-[0.95] tracking-[-0.03em] text-white">
                {scene?.kind === 'scene' ? scene.title : project.title}
              </h3>
              {scene?.kind === 'scene' && (
                <p className="mt-5 max-w-3xl text-[clamp(10px,1.35vw,20px)] font-medium leading-relaxed text-white/68">
                  {scene.body}
                </p>
              )}
              {textLayers.map((layer) =>
                layer.kind === 'text' ? (
                  <p key={layer.id} className="mt-3 text-[clamp(10px,1.2vw,18px)] text-white/80">
                    {layer.text}
                  </p>
                ) : null,
              )}
            </div>

            <div className="flex items-end justify-between gap-4">
              <div className="max-w-[78%]">
                {scene?.kind === 'scene' && scene.disclaimer && (
                  <p className="text-[clamp(7px,0.72vw,10px)] leading-relaxed text-white/35">
                    {scene.disclaimer}
                  </p>
                )}
                {caption?.kind === 'caption' && (
                  <p className="mt-2 rounded bg-black/55 px-2 py-1 text-[clamp(9px,1vw,13px)] text-white/85">
                    {caption.text}
                  </p>
                )}
              </div>
              <div className="font-mono text-[clamp(7px,0.8vw,11px)] font-bold uppercase tracking-[0.2em] text-cyan-200/55">
                Draft · offline
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
