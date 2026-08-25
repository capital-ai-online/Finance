/**
 * SEO-GM-ROADMAP-0002 / WP-N3 — asset validation plane (ESS-0024 §8 plane 7).
 *
 * `mediaUrl` is caller-supplied and is fetched **by this server** before a
 * YouTube upload (`platformPublishers.ts`), and handed to TikTok/Instagram as a
 * PULL_FROM_URL source. Unvalidated, that is a server-side request forgery
 * vector: a caller can point the publisher at cloud metadata
 * (`169.254.169.254`), at loopback services, or at an internal host, and use
 * the publish path as a probe.
 *
 * ESS-0024 §13 requires `invalid/private media URL -> DENY` as a negative test.
 * This module is that gate. It is provider-neutral on purpose: whichever
 * renderer WP-N3 eventually selects (make-or-buy is an Owner decision), its
 * output passes through here before any platform call.
 *
 * SECURITY (2026-08-25 architecture review, finding #9): DNS used to be resolved only here for
 * the up-front validation, while the actual connection was opened later by a plain `fetch(url)` in
 * platformPublishers.ts, which re-resolves DNS independently. A hostile authoritative resolver with
 * a short TTL could answer a public address for this first lookup and a private/metadata address
 * for the second (DNS rebinding), turning the validated `mediaUrl` fetch into SSRF against internal
 * services or the cloud metadata endpoint. `fetchValidatedMediaAsset` below closes that TOCTOU
 * window by resolving and validating the hostname again immediately before connecting, and pinning
 * the TCP connection to that freshly-validated address via a custom `lookup` - the connection can no
 * longer answer differently than what was just validated. Host header and TLS SNI still use the
 * original hostname (only the DNS step is overridden), so certificate validation is unaffected.
 */

import { isIP } from 'node:net';
import { promises as dns } from 'node:dns';
import https from 'node:https';

export type MediaAssetDenyCode =
  | 'media_url_malformed'
  | 'media_url_scheme'
  | 'media_url_credentials'
  | 'media_url_private_host'
  | 'media_url_unresolvable';

export interface MediaAssetValidationResult {
  ok: boolean;
  code?: MediaAssetDenyCode;
  reason?: string;
}

/** Hostnames that never denote a public asset host. */
const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa'];
const BLOCKED_HOSTNAMES = ['localhost', 'ip6-localhost', 'ip6-loopback'];

function ipv4ToParts(address: string): number[] | null {
  const parts = address.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return parts;
}

/**
 * Everything outside globally routable unicast space is refused — not only the
 * classic RFC 1918 ranges. Link-local (169.254/16) carries the cloud metadata
 * endpoints, and CGNAT (100.64/10) is reachable inside many hosting networks.
 */
function isPrivateIpv4(address: string): boolean {
  const parts = ipv4ToParts(address);
  if (!parts) return true; // unparseable is treated as unsafe
  const [a, b] = parts;

  if (a === 0) return true; // "this" network
  if (a === 10) return true; // RFC 1918
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC 1918
  if (a === 192 && b === 168) return true; // RFC 1918
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT, RFC 6598
  if (a === 192 && b === 0) return true; // IETF protocol assignments / TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking, RFC 2544
  if (a === 198 && b === 51) return true; // TEST-NET-2
  if (a === 203 && b === 0) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast, reserved, broadcast
  return false;
}

/**
 * Expand an IPv6 address to its eight 16-bit groups.
 *
 * Matching on the textual form is not enough: the WHATWG URL parser rewrites
 * `::ffff:169.254.169.254` to `::ffff:a9fe:a9fe`, so a regex for the dotted
 * shape lets the cloud-metadata address through in its hex spelling.
 */
function expandIpv6(address: string): number[] | null {
  let text = address.toLowerCase().split('%')[0]; // strip zone index

  // A trailing dotted quad occupies the final two groups.
  const dotted = text.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    const parts = ipv4ToParts(dotted[1]);
    if (!parts) return null;
    const hex = `${((parts[0] << 8) | parts[1]).toString(16)}:${((parts[2] << 8) | parts[3]).toString(16)}`;
    text = text.slice(0, dotted.index) + hex;
  }

  const halves = text.split('::');
  if (halves.length > 2) return null;

  const toGroups = (segment: string): number[] =>
    segment ? segment.split(':').map((group) => parseInt(group, 16)) : [];

  const head = toGroups(halves[0]);
  const tail = halves.length === 2 ? toGroups(halves[1]) : [];
  const groups =
    halves.length === 2
      ? [...head, ...new Array(Math.max(0, 8 - head.length - tail.length)).fill(0), ...tail]
      : head;

  if (groups.length !== 8 || groups.some((group) => !Number.isInteger(group) || group < 0 || group > 0xffff)) {
    return null;
  }
  return groups;
}

function isPrivateIpv6(address: string): boolean {
  const groups = expandIpv6(address);
  if (!groups) return true; // unparseable is treated as unsafe

  const leadingZero = groups.slice(0, 5).every((group) => group === 0);

  // IPv4-mapped (::ffff:0:0/96) and IPv4-compatible (::/96) are judged by the
  // embedded v4 address, in whichever spelling they arrived.
  if (leadingZero && (groups[5] === 0xffff || groups[5] === 0)) {
    const embedded = [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join('.');
    if (groups[5] === 0 && groups[6] === 0 && groups[7] <= 1) return true; // :: and ::1
    return isPrivateIpv4(embedded);
  }

  if ((groups[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((groups[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((groups[0] & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  return false;
}

export function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true; // not an IP literal at all — caller must resolve first
}

function deny(code: MediaAssetDenyCode, reason: string): MediaAssetValidationResult {
  return { ok: false, code, reason };
}

/** Injectable for tests so the suite never depends on real DNS. */
export type AddressResolver = (hostname: string) => Promise<string[]>;

const defaultResolver: AddressResolver = async (hostname) => {
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  return records.map((record) => record.address);
};

export async function validateMediaAssetUrl(
  rawUrl: string,
  resolver: AddressResolver = defaultResolver,
): Promise<MediaAssetValidationResult> {
  const candidate = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  if (!candidate) return deny('media_url_malformed', 'mediaUrl ist leer.');

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return deny('media_url_malformed', 'mediaUrl ist keine gueltige absolute URL.');
  }

  // https only: the platforms require a publicly retrievable asset anyway, and
  // this rules out file:, data:, gopher: and plaintext http in one step.
  if (url.protocol !== 'https:') {
    return deny('media_url_scheme', `mediaUrl muss https verwenden (erhalten: ${url.protocol}).`);
  }

  // user:pass@host would send credentials along with the server-side fetch.
  if (url.username || url.password) {
    return deny('media_url_credentials', 'mediaUrl darf keine Zugangsdaten enthalten.');
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!hostname) return deny('media_url_malformed', 'mediaUrl enthaelt keinen Host.');

  if (
    BLOCKED_HOSTNAMES.includes(hostname) ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    return deny('media_url_private_host', `mediaUrl zeigt auf einen nicht oeffentlichen Host (${hostname}).`);
  }

  // IP literals never need DNS and must be public on their own.
  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) {
      return deny('media_url_private_host', `mediaUrl zeigt auf eine nicht oeffentliche Adresse (${hostname}).`);
    }
    return { ok: true };
  }

  let addresses: string[];
  try {
    addresses = await resolver(hostname);
  } catch {
    return deny('media_url_unresolvable', `mediaUrl-Host ist nicht aufloesbar (${hostname}).`);
  }

  if (!addresses.length) {
    return deny('media_url_unresolvable', `mediaUrl-Host liefert keine Adresse (${hostname}).`);
  }

  // Every answer must be public: a name resolving to one public and one private
  // address would otherwise be usable to reach the private one.
  const offending = addresses.find((address) => isPrivateAddress(address));
  if (offending) {
    return deny(
      'media_url_private_host',
      `mediaUrl-Host loest auf eine nicht oeffentliche Adresse auf (${hostname} -> ${offending}).`,
    );
  }

  return { ok: true };
}

export interface PinnedMediaFetchResult {
  ok: boolean;
  status: number;
  body?: Buffer;
  error?: string;
}

/**
 * Fetches an already-validated `mediaUrl`, re-resolving and re-validating the hostname
 * immediately before opening the connection and pinning the socket to that address (see the
 * file-level note above). Use this instead of a bare `fetch(mediaUrl)` for any server-side
 * download of a caller-supplied media asset.
 */
export async function fetchValidatedMediaAsset(
  rawUrl: string,
  resolver: AddressResolver = defaultResolver,
  timeoutMs = 30_000,
): Promise<PinnedMediaFetchResult> {
  const revalidated = await validateMediaAssetUrl(rawUrl, resolver);
  if (!revalidated.ok) {
    return { ok: false, status: 0, error: revalidated.reason || 'mediaUrl hat die Validierung nicht bestanden.' };
  }

  const url = new URL(rawUrl);
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  let pinnedAddress: string;
  let pinnedFamily: 4 | 6;
  if (isIP(hostname)) {
    pinnedAddress = hostname;
    pinnedFamily = isIP(hostname) === 6 ? 6 : 4;
  } else {
    const addresses = await resolver(hostname);
    const publicAddress = addresses.find((address) => !isPrivateAddress(address));
    if (!publicAddress) {
      return { ok: false, status: 0, error: `mediaUrl-Host loest auf keine oeffentliche Adresse mehr auf (${hostname}).` };
    }
    pinnedAddress = publicAddress;
    pinnedFamily = isIP(publicAddress) === 6 ? 6 : 4;
  }

  return new Promise<PinnedMediaFetchResult>((resolve) => {
    const req = https.request(
      {
        hostname,
        // Host header + TLS SNI stay bound to the original hostname (Node derives both from
        // `hostname` by default); `lookup` is the only overridden step, pinning the actual TCP
        // connection to the address that was just validated above.
        servername: hostname,
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        timeout: timeoutMs,
        lookup: (_hostname: string, _options: unknown, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
          callback(null, pinnedAddress, pinnedFamily);
        },
      } as https.RequestOptions,
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const status = res.statusCode || 0;
          resolve({ ok: status >= 200 && status < 300, status, body: Buffer.concat(chunks) });
        });
        res.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
      },
    );
    req.on('timeout', () => req.destroy(new Error('Zeitueberschreitung beim Abruf des mediaUrl-Assets.')));
    req.on('error', (err) => resolve({ ok: false, status: 0, error: err.message }));
    req.end();
  });
}
