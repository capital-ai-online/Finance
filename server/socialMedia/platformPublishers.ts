// ADR-0026 — Echte Veroeffentlichungs-Calls pro Plattform.
//
// Ersetzt den Handover-Prototyp, der fuer jede Plattform ausschliesslich eine aus
// `Date.now()` konstruierte Fake-URL zurueckgab, ohne je einen HTTP-Request an YouTube/
// TikTok/Instagram/Facebook/X zu senden.
//
// Wichtige, bewusste Grenze dieser Implementierung (siehe ADR-0026 Abschnitt 3 fuer die
// vollstaendige Begruendung): das im Handover uebergebene System erzeugt Podcast-Skripte,
// Video-Storyboards und Marketing-Texte, aber KEIN gerendertes Video-/Audio-File - der dafuer
// zustaendige Service (SocialMediaGeneratorService.generateSeries) wurde im Handover nicht
// mitgeliefert und existiert in diesem Repository nicht. YouTube/TikTok/Instagram-Reels
// verlangen zwingend eine oeffentlich erreichbare Video-URL (`mediaUrl`); ohne sie schlaegt die
// Veroeffentlichung auf diesen drei Plattformen MIT EXPLIZITER FEHLERMELDUNG fehl, statt eine
// erfundene Erfolgs-URL zu liefern. X (reiner Text-Tweet) und Facebook (Text-Post auf einer
// Page) funktionieren bereits jetzt vollstaendig ohne Media-Asset.

import { createLogger } from '../logger';
import type { SupportedAccountPlatform } from '../../src/platform/SocialMediaEngine/types';
import { fetchValidatedMediaAsset } from './mediaAssetValidation';

const logger = createLogger('social-media:publish');

export interface PublishInput {
  accessToken: string;
  externalAccountId: string | null;
  caption: string;
  hashtags: string[];
  videoTitle?: string;
  mediaUrl?: string;
}

export interface PublishResult {
  success: boolean;
  publishedUrl?: string;
  /** Fuer Plattformen mit asynchroner Freigabe/Verarbeitung (TikTok-Review, IG-Videoverarbeitung). */
  pending?: boolean;
  errorMessage?: string;
}

function mediaRequiredError(platform: string): PublishResult {
  return {
    success: false,
    errorMessage: `${platform}: Kein mediaUrl im Publish-Request vorhanden. ${platform} erfordert ein ` +
      `oeffentlich erreichbares Video-Asset - dieses System rendert aktuell keine Videos ` +
      `(siehe ADR-0026, Abschnitt 3: Content-Generation-Service war nicht Teil des Handovers).`,
  };
}

async function publishToYouTube(input: PublishInput): Promise<PublishResult> {
  if (!input.mediaUrl) return mediaRequiredError('YouTube');
  try {
    // SECURITY (2026-08-25 architecture review, finding #9): fetchValidatedMediaAsset pins the
    // connection to a freshly re-validated address instead of a bare fetch(), closing the DNS-
    // rebinding TOCTOU window between the route-level validateMediaAssetUrl check and this download.
    const videoRes = await fetchValidatedMediaAsset(input.mediaUrl);
    if (!videoRes.ok || !videoRes.body) {
      return { success: false, errorMessage: `YouTube: mediaUrl nicht erreichbar (HTTP ${videoRes.status}${videoRes.error ? `, ${videoRes.error}` : ''}).` };
    }
    const videoBytes = videoRes.body;
    const metadata = {
      snippet: { title: input.videoTitle || input.caption.slice(0, 100), description: input.caption, tags: input.hashtags },
      status: { privacyStatus: 'public' },
    };
    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${input.accessToken}` },
        body: Uint8Array.from(buildMultipartYoutubeBody(metadata, videoBytes)),
      }
    );
    const json: any = await uploadRes.json();
    if (!uploadRes.ok || !json.id) {
      return { success: false, errorMessage: `YouTube-Upload fehlgeschlagen: ${JSON.stringify(json.error || json)}` };
    }
    return { success: true, publishedUrl: `https://youtube.com/watch?v=${json.id}` };
  } catch (err: any) {
    return { success: false, errorMessage: `YouTube-Upload-Fehler: ${err?.message || String(err)}` };
  }
}

function buildMultipartYoutubeBody(metadata: object, videoBytes: Buffer): Buffer {
  const boundary = 'capitalai_yt_boundary';
  const head = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: video/*\r\n\r\n`
  );
  const tail = Buffer.from(`\r\n--${boundary}--`);
  return Buffer.concat([head, videoBytes, tail]);
}

async function publishToTikTok(input: PublishInput): Promise<PublishResult> {
  if (!input.mediaUrl) return mediaRequiredError('TikTok');
  try {
    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${input.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_info: {
          title: input.caption,
          privacy_level: 'PUBLIC_TO_EVERYONE',
        },
        source_info: { source: 'PULL_FROM_URL', video_url: input.mediaUrl },
      }),
    });
    const json: any = await res.json();
    if (!res.ok || json.error?.code !== 'ok') {
      return { success: false, errorMessage: `TikTok-Publish fehlgeschlagen: ${JSON.stringify(json.error || json)}` };
    }
    return { success: true, pending: true, publishedUrl: undefined };
  } catch (err: any) {
    return { success: false, errorMessage: `TikTok-Publish-Fehler: ${err?.message || String(err)}` };
  }
}

async function publishToInstagram(input: PublishInput): Promise<PublishResult> {
  if (!input.mediaUrl) return mediaRequiredError('Instagram');
  if (!input.externalAccountId) {
    return { success: false, errorMessage: 'Instagram: Kein verknuepftes Business-Konto (externalAccountId fehlt).' };
  }
  try {
    const accountId = encodeURIComponent(String(input.externalAccountId));
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/media`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: input.mediaUrl,
          caption: input.caption,
        }),
      }
    );
    const containerJson: any = await containerRes.json();
    if (!containerRes.ok || !containerJson.id) {
      return { success: false, errorMessage: `Instagram-Container-Erstellung fehlgeschlagen: ${JSON.stringify(containerJson.error || containerJson)}` };
    }

    const containerId = encodeURIComponent(String(containerJson.id));
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/${containerId}?fields=status_code`,
        { headers: { Authorization: `Bearer ${input.accessToken}` } }
      );
      const statusJson: any = await statusRes.json();
      if (!statusRes.ok) {
        return { success: false, errorMessage: `Instagram-Statusabfrage fehlgeschlagen (HTTP ${statusRes.status}).` };
      }
      if (statusJson.status_code === 'FINISHED') {
        const publishRes = await fetch(
          `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${input.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ creation_id: containerJson.id }),
          }
        );
        const publishJson: any = await publishRes.json();
        if (!publishRes.ok || !publishJson.id) {
          return { success: false, errorMessage: `Instagram-Publish fehlgeschlagen: ${JSON.stringify(publishJson.error || publishJson)}` };
        }
        return { success: true, publishedUrl: `https://instagram.com/reel/${publishJson.id}` };
      }
      if (statusJson.status_code === 'ERROR') {
        return { success: false, errorMessage: `Instagram-Videoverarbeitung fehlgeschlagen: ${JSON.stringify(statusJson)}` };
      }
    }
    return { success: true, pending: true, publishedUrl: undefined, errorMessage: 'Instagram verarbeitet das Video noch - Status muss spaeter erneut geprueft werden.' };
  } catch (err: any) {
    return { success: false, errorMessage: `Instagram-Publish-Fehler: ${err?.message || String(err)}` };
  }
}

async function publishToFacebook(input: PublishInput): Promise<PublishResult> {
  if (!input.externalAccountId) {
    return { success: false, errorMessage: 'Facebook: Keine verknuepfte Page (externalAccountId fehlt).' };
  }
  try {
    const accountId = encodeURIComponent(String(input.externalAccountId));
    if (input.mediaUrl) {
      const res = await fetch(`https://graph.facebook.com/v19.0/${accountId}/videos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_url: input.mediaUrl, description: input.caption }),
      });
      const json: any = await res.json();
      if (!res.ok || !json.id) {
        return { success: false, errorMessage: `Facebook-Video-Post fehlgeschlagen: ${JSON.stringify(json.error || json)}` };
      }
      return { success: true, publishedUrl: `https://facebook.com/${json.id}` };
    }
    const res = await fetch(`https://graph.facebook.com/v19.0/${accountId}/feed`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: input.caption }),
    });
    const json: any = await res.json();
    if (!res.ok || !json.id) {
      return { success: false, errorMessage: `Facebook-Post fehlgeschlagen: ${JSON.stringify(json.error || json)}` };
    }
    return { success: true, publishedUrl: `https://facebook.com/${json.id}` };
  } catch (err: any) {
    return { success: false, errorMessage: `Facebook-Publish-Fehler: ${err?.message || String(err)}` };
  }
}

async function publishToX(input: PublishInput): Promise<PublishResult> {
  try {
    const text = input.caption.length > 280 ? `${input.caption.slice(0, 277)}...` : input.caption;
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${input.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const json: any = await res.json();
    if (!res.ok || !json.data?.id) {
      return { success: false, errorMessage: `X-Tweet fehlgeschlagen: ${JSON.stringify(json.errors || json)}` };
    }
    return { success: true, publishedUrl: `https://x.com/i/status/${json.data.id}` };
  } catch (err: any) {
    return { success: false, errorMessage: `X-Publish-Fehler: ${err?.message || String(err)}` };
  }
}

const PUBLISHERS: Record<SupportedAccountPlatform, (input: PublishInput) => Promise<PublishResult>> = {
  youtube: publishToYouTube,
  tiktok: publishToTikTok,
  instagram: publishToInstagram,
  facebook: publishToFacebook,
  x: publishToX,
};

export async function publishToPlatform(platform: SupportedAccountPlatform, input: PublishInput): Promise<PublishResult> {
  try {
    return await PUBLISHERS[platform](input);
  } catch (err: any) {
    logger.error('Unerwarteter Fehler im Publish-Pfad', { platform, error: err?.message || String(err) });
    return { success: false, errorMessage: `Unerwarteter Fehler: ${err?.message || String(err)}` };
  }
}
