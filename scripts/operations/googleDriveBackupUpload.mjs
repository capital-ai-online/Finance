#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const DRIVE_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';

export function escapeDriveQueryValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function fileDigests(filePath) {
  const data = fs.readFileSync(filePath);
  return {
    size: data.length,
    md5: crypto.createHash('md5').update(data).digest('hex'),
    sha256: crypto.createHash('sha256').update(data).digest('hex'),
  };
}

async function oauthAccessToken() {
  const clientId = process.env.OPS_RECOVERY_GDRIVE_CLIENT_ID;
  const clientSecret = process.env.OPS_RECOVERY_GDRIVE_CLIENT_SECRET;
  const refreshToken = process.env.OPS_RECOVERY_GDRIVE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Google Drive OAuth credentials are incomplete: OPS_RECOVERY_GDRIVE_CLIENT_ID, ' +
      'OPS_RECOVERY_GDRIVE_CLIENT_SECRET and OPS_RECOVERY_GDRIVE_REFRESH_TOKEN are required.',
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    throw new Error(`Google OAuth token refresh failed with HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (typeof payload.access_token !== 'string' || payload.access_token.length < 20) {
    throw new Error('Google OAuth token response did not contain a usable access token.');
  }
  return payload.access_token;
}

async function driveRequest(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Drive API HTTP ${response.status}: ${text.slice(0, 500)}`);
  }
  return response;
}

async function findExisting(accessToken, folderId, name) {
  const params = new URLSearchParams({
    q: `'${escapeDriveQueryValue(folderId)}' in parents and name = '${escapeDriveQueryValue(name)}' and trashed = false`,
    spaces: 'drive',
    pageSize: '10',
    fields: 'files(id,name,size,md5Checksum,appProperties,parents,createdTime)',
  });
  const response = await driveRequest(`${DRIVE_FILES_ENDPOINT}?${params}`, accessToken);
  const payload = await response.json();
  return Array.isArray(payload.files) ? payload.files : [];
}

async function uploadImmutable(accessToken, folderId, filePath) {
  const name = path.basename(filePath);
  const digests = fileDigests(filePath);
  const existing = await findExisting(accessToken, folderId, name);

  if (existing.length > 1) {
    throw new Error(`Refusing ambiguous Drive archive name: ${name} exists ${existing.length} times.`);
  }
  if (existing.length === 1) {
    const file = existing[0];
    const sameSize = Number(file.size) === digests.size;
    const sameMd5 = file.md5Checksum === digests.md5;
    const sameSha = file.appProperties?.sha256 === digests.sha256;
    if (sameSize && (sameMd5 || sameSha)) {
      return { state: 'EXISTS_VERIFIED', id: file.id, name, ...digests };
    }
    throw new Error(`Refusing to overwrite immutable Drive archive with mismatched digest: ${name}`);
  }

  const boundary = `capital-ai-${crypto.randomBytes(12).toString('hex')}`;
  const metadata = {
    name,
    parents: [folderId],
    appProperties: {
      sha256: digests.sha256,
      source: 'capital-ai-ops-recovery',
    },
  };
  const fileBytes = fs.readFileSync(filePath);
  const prefix = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n--${boundary}\r\n` +
    'Content-Type: application/octet-stream\r\n\r\n',
  );
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([prefix, fileBytes, suffix]);

  const params = new URLSearchParams({
    uploadType: 'multipart',
    fields: 'id,name,size,md5Checksum,appProperties,parents,createdTime',
  });
  const response = await driveRequest(`${DRIVE_UPLOAD_ENDPOINT}?${params}`, accessToken, {
    method: 'POST',
    headers: { 'content-type': `multipart/related; boundary=${boundary}` },
    body,
  });
  const created = await response.json();
  if (
    created.name !== name ||
    Number(created.size) !== digests.size ||
    (created.md5Checksum && created.md5Checksum !== digests.md5) ||
    created.appProperties?.sha256 !== digests.sha256
  ) {
    throw new Error(`Google Drive readback mismatch for uploaded archive: ${name}`);
  }
  return { state: 'UPLOADED_VERIFIED', id: created.id, name, ...digests };
}

export async function uploadFiles(filePaths) {
  const folderId = process.env.OPS_RECOVERY_GDRIVE_FOLDER_ID;
  if (!folderId) throw new Error('OPS_RECOVERY_GDRIVE_FOLDER_ID is required.');
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    throw new Error('At least one backup file path is required.');
  }
  for (const filePath of filePaths) {
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size === 0) {
      throw new Error(`Backup file is missing or empty: ${filePath}`);
    }
  }

  const accessToken = await oauthAccessToken();
  const results = [];
  for (const filePath of filePaths) {
    results.push(await uploadImmutable(accessToken, folderId, filePath));
  }
  return results;
}

async function main() {
  const results = await uploadFiles(process.argv.slice(2));
  process.stdout.write(JSON.stringify({ files: results }, null, 2) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
