#!/usr/bin/env node
/** Isolated pub/sub benchmark harness. No production imports. */
import { createConnection } from "node:net";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROFILES = {
  smoke: { subscribers: 100, publishCount: 50, warmup: 10 },
  mid: { subscribers: 1000, publishCount: 100, warmup: 20 },
  future: { subscribers: 10000, publishCount: 200, warmup: 20 },
};
const TARGETS = {
  "redis-local": { kind: "redis", host: "127.0.0.1", port: 16379 },
  "valkey-local": { kind: "redis", host: "127.0.0.1", port: 16380 },
  "nats-local": { kind: "nats", host: "127.0.0.1", port: 14222, varz: "http://127.0.0.1:18222/varz" },
  upstash: { kind: "redis", urlEnv: "UPSTASH_REDIS_URL" },
  "render-valkey": { kind: "redis", urlEnv: "RENDER_VALKEY_URL" },
};

function parseArgs(argv) {
  const out = { profile: "smoke", targets: ["redis-local", "valkey-local", "nats-local"], channel: process.env.BENCH_CHANNEL || "capital-ai.bench.fanout" };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--profile") out.profile = argv[++i];
    else if (a === "--targets") out.targets = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--channel") out.channel = argv[++i];
  }
  if (!PROFILES[out.profile]) throw new Error(`unknown profile ${out.profile}`);
  return out;
}
function percentile(sorted, p) {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
}
function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return { n: sorted.length, min_ms: sorted[0] ?? null, p50_ms: percentile(sorted, 50), p95_ms: percentile(sorted, 95), p99_ms: percentile(sorted, 99), max_ms: sorted.at(-1) ?? null };
}
function parseRedisUrl(url) {
  const u = new URL(url);
  return { host: u.hostname, port: Number(u.port || 6379), password: decodeURIComponent(u.password || ""), tls: u.protocol === "rediss:" };
}
function connectTcp({ host, port, tls = false, timeoutMs = 8000 }) {
  return new Promise((resolveConn, reject) => {
    const work = tls ? import("node:tls").then((m) => m.default.connect({ host, port, servername: host })) : Promise.resolve(createConnection({ host, port }));
    work.then((sock) => {
      const timer = setTimeout(() => { sock.destroy(); reject(new Error(`connect timeout ${host}:${port}`)); }, timeoutMs);
      sock.once("connect", () => { clearTimeout(timer); sock.setNoDelay(true); resolveConn(sock); });
      sock.once("error", (err) => { clearTimeout(timer); reject(err); });
    }).catch(reject);
  });
}
function redisCommand(args) {
  let out = `*${args.length}\r\n`;
  for (const a of args) {
    const b = Buffer.from(String(a));
    out += `$${b.length}\r\n${b.toString("latin1")}\r\n`;
  }
  return out;
}
async function redisAuth(sock, password) {
  if (!password) return;
  sock.write(redisCommand(["AUTH", password]));
  await readUntil(sock, (buf) => buf.includes("+OK") || buf.includes("-ERR"));
}
function readUntil(sock, pred, timeoutMs = 15000) {
  return new Promise((resolveRead, reject) => {
    let buf = Buffer.alloc(0);
    const onData = (chunk) => { buf = Buffer.concat([buf, chunk]); if (pred(buf)) { cleanup(); resolveRead(buf); } };
    const onErr = (err) => { cleanup(); reject(err); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("read timeout")); }, timeoutMs);
    const cleanup = () => { clearTimeout(timer); sock.off("data", onData); sock.off("error", onErr); };
    sock.on("data", onData);
    sock.on("error", onErr);
  });
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function pack(name, profile, connected, delivery, publishAck, memoryBytes, disconnectRecoveryMs) {
  return {
    target: name,
    measured_at: new Date().toISOString(),
    profile,
    subscribers_requested: profile.subscribers,
    subscribers_connected: connected,
    delivery_latency: summarize(delivery),
    publish_latency: summarize(publishAck),
    memory_bytes: memoryBytes,
    disconnect_recovery_ms: disconnectRecoveryMs == null ? null : Number(disconnectRecoveryMs.toFixed(3)),
    notes: connected < profile.subscribers ? "partial connect; target likely hit a connection ceiling" : "ok",
  };
}
async function measureRedisLike(name, endpoint, profile, channel) {
  const payload = "x".repeat(Number(process.env.BENCH_PAYLOAD_BYTES || 256));
  const clients = [];
  const delivery = [];
  const publishAck = [];
  let memoryBytes = null;
  let disconnectRecoveryMs = null;
  let connected = 0;
  const pending = new Map();
  try {
    const infoSock = await connectTcp(endpoint);
    await redisAuth(infoSock, endpoint.password);
    infoSock.write(redisCommand(["INFO", "memory"]));
    const infoBuf = await readUntil(infoSock, (b) => b.includes("used_memory:"));
    const match = infoBuf.toString().match(/used_memory:(\d+)/);
    memoryBytes = match ? Number(match[1]) : null;
    for (let i = 0; i < profile.subscribers; i += 1) {
      const sock = await connectTcp(endpoint);
      await redisAuth(sock, endpoint.password);
      sock.write(redisCommand(["SUBSCRIBE", channel]));
      await readUntil(sock, (b) => b.includes(channel));
      sock.on("data", (chunk) => {
        const idMatch = chunk.toString().match(/msg:(\d+)/);
        if (!idMatch) return;
        const started = pending.get(Number(idMatch[1]));
        if (started != null) delivery.push(performance.now() - started);
      });
      clients.push(sock);
      connected += 1;
    }
    const pub = await connectTcp(endpoint);
    await redisAuth(pub, endpoint.password);
    const runPublish = async (id) => {
      const body = `msg:${id}:${payload}`;
      const t0 = performance.now();
      pending.set(id, t0);
      pub.write(redisCommand(["PUBLISH", channel, body]));
      await readUntil(pub, (b) => /:[0-9]+\r\n/.test(b.toString()) || b.includes("integer"));
      publishAck.push(performance.now() - t0);
    };
    for (let i = 0; i < profile.warmup; i += 1) await runPublish(i);
    delivery.length = 0; publishAck.length = 0; pending.clear();
    for (let i = 0; i < profile.publishCount; i += 1) await runPublish(10000 + i);
    await sleep(250);
    const dropCount = Math.max(1, Math.floor(clients.length * 0.1));
    const rec0 = performance.now();
    for (const s of clients.splice(0, dropCount)) s.destroy();
    for (let i = 0; i < dropCount; i += 1) {
      const sock = await connectTcp(endpoint);
      await redisAuth(sock, endpoint.password);
      sock.write(redisCommand(["SUBSCRIBE", channel]));
      await readUntil(sock, (b) => b.includes(channel));
      clients.push(sock);
    }
    pub.write(redisCommand(["PUBLISH", channel, "msg:99999:recover"]));
    await sleep(300);
    disconnectRecoveryMs = performance.now() - rec0;
    infoSock.write(redisCommand(["INFO", "memory"]));
    const info2 = await readUntil(infoSock, (b) => b.includes("used_memory:"));
    const match2 = info2.toString().match(/used_memory:(\d+)/);
    memoryBytes = match2 ? Number(match2[1]) : memoryBytes;
    infoSock.destroy(); pub.destroy();
  } finally {
    for (const c of clients) c.destroy();
  }
  return pack(name, profile, connected, delivery, publishAck, memoryBytes, disconnectRecoveryMs);
}
async function measureNats(name, endpoint, profile, channel) {
  const payload = "x".repeat(Number(process.env.BENCH_PAYLOAD_BYTES || 256));
  const clients = [];
  const delivery = [];
  const publishAck = [];
  let memoryBytes = null;
  let disconnectRecoveryMs = null;
  let connected = 0;
  const pending = new Map();
  const connectNats = async () => {
    const sock = await connectTcp(endpoint);
    sock.write(`CONNECT {"verbose":false,"pedantic":false,"headers":false}\r\nPING\r\n`);
    await readUntil(sock, (b) => b.includes("PONG"));
    return sock;
  };
  try {
    if (endpoint.varz) {
      try { const json = await (await fetch(endpoint.varz)).json(); memoryBytes = json.mem ?? null; } catch { memoryBytes = null; }
    }
    for (let i = 0; i < profile.subscribers; i += 1) {
      const sock = await connectNats();
      sock.write(`SUB ${channel} ${i + 1}\r\n`);
      sock.on("data", (chunk) => {
        const idMatch = chunk.toString().match(/msg:(\d+)/);
        if (!idMatch) return;
        const started = pending.get(Number(idMatch[1]));
        if (started != null) delivery.push(performance.now() - started);
      });
      clients.push(sock);
      connected += 1;
    }
    const pub = await connectNats();
    const runPublish = async (id) => {
      const body = `msg:${id}:${payload}`;
      const t0 = performance.now();
      pending.set(id, t0);
      pub.write(`PUB ${channel} ${Buffer.byteLength(body)}\r\n${body}\r\n`);
      publishAck.push(performance.now() - t0);
    };
    for (let i = 0; i < profile.warmup; i += 1) await runPublish(i);
    await sleep(50);
    delivery.length = 0; publishAck.length = 0; pending.clear();
    for (let i = 0; i < profile.publishCount; i += 1) await runPublish(10000 + i);
    await sleep(250);
    const dropCount = Math.max(1, Math.floor(clients.length * 0.1));
    const rec0 = performance.now();
    for (const s of clients.splice(0, dropCount)) s.destroy();
    for (let i = 0; i < dropCount; i += 1) {
      const sock = await connectNats();
      sock.write(`SUB ${channel} ${10000 + i}\r\n`);
      clients.push(sock);
    }
    const body = "msg:99999:recover";
    pub.write(`PUB ${channel} ${Buffer.byteLength(body)}\r\n${body}\r\n`);
    await sleep(300);
    disconnectRecoveryMs = performance.now() - rec0;
    pub.destroy();
    if (endpoint.varz) {
      try { const json = await (await fetch(endpoint.varz)).json(); memoryBytes = json.mem ?? memoryBytes; } catch { /* keep */ }
    }
  } finally {
    for (const c of clients) c.destroy();
  }
  return pack(name, profile, connected, delivery, publishAck, memoryBytes, disconnectRecoveryMs);
}
function resolveEndpoint(name) {
  const spec = TARGETS[name];
  if (!spec) throw new Error(`unknown target ${name}`);
  if (spec.urlEnv) {
    const url = process.env[spec.urlEnv];
    if (!url) throw new Error(`${spec.urlEnv} is not set; ${name} is remote-only`);
    return { ...spec, ...parseRedisUrl(url) };
  }
  return spec;
}
async function main() {
  const args = parseArgs(process.argv);
  const profile = {
    ...PROFILES[args.profile],
    publishCount: Number(process.env.BENCH_PUBLISH_COUNT || PROFILES[args.profile].publishCount),
    warmup: Number(process.env.BENCH_WARMUP || PROFILES[args.profile].warmup),
  };
  const results = [];
  for (const name of args.targets) {
    process.stderr.write(`measuring ${name} subscribers=${profile.subscribers}\n`);
    try {
      const endpoint = resolveEndpoint(name);
      const row = endpoint.kind === "nats"
        ? await measureNats(name, endpoint, profile, args.channel)
        : await measureRedisLike(name, endpoint, profile, args.channel);
      results.push(row);
    } catch (err) {
      results.push({ target: name, measured_at: new Date().toISOString(), profile, error: String(err?.message || err), notes: "not measured in this environment" });
    }
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = resolve(ROOT, "results");
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, `${stamp}-${args.profile}.json`);
  writeFileSync(outFile, `${JSON.stringify({ args, results }, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ outFile, results }, null, 2)}\n`);
}
main().catch((err) => { process.stderr.write(`${err.stack || err}\n`); process.exit(1); });
