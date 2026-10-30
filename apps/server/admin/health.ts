import { access, constants, statfs } from "node:fs/promises";
import { sql } from "drizzle-orm";
import type { Database } from "../db/connection.js";
import { getIntegrationStatus } from "../integrations/integrations.js";
import { storageConfigured } from "../storage/r2.js";
import { projectsRoot } from "../projects/workspace.js";
import { pingRedis, redisConfigured } from "../redis.js";

export type HealthStatus = "ok" | "degraded" | "down";

export interface HealthCheck {
  id: string;
  name: string;
  status: HealthStatus;
  detail: string;
  latencyMs?: number;
}

export interface HealthReport {
  ok: boolean;
  status: HealthStatus;
  /** 0-100: ok = 1, degraded = 0.5, down = 0, averaged over all checks. */
  score: number;
  dbMs: number;
  uptimeSeconds: number;
  checks: HealthCheck[];
}

const CHECK_TIMEOUT_MS = 3000;

const WEIGHT: Record<HealthStatus, number> = { ok: 1, degraded: 0.5, down: 0 };

export function scoreChecks(checks: Pick<HealthCheck, "status">[]): {
  score: number;
  status: HealthStatus;
} {
  if (checks.length === 0) return { score: 0, status: "down" };
  const score = Math.round(
    (checks.reduce((sum, c) => sum + WEIGHT[c.status], 0) / checks.length) * 100,
  );
  // A hard failure anywhere should never read as "all good".
  const status: HealthStatus = checks.some((c) => c.status === "down")
    ? "down"
    : checks.some((c) => c.status === "degraded")
      ? "degraded"
      : "ok";
  return { score, status };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

async function checkDatabase(db: Database): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await withTimeout(db.execute(sql`SELECT 1`), CHECK_TIMEOUT_MS);
    const ms = Date.now() - start;
    return {
      id: "database",
      name: "Database",
      status: ms < 250 ? "ok" : ms < 1000 ? "degraded" : "down",
      detail: `${ms}ms query`,
      latencyMs: ms,
    };
  } catch (err) {
    return { id: "database", name: "Database", status: "down", detail: errMsg(err) };
  }
}

async function checkAiEngine(): Promise<HealthCheck> {
  try {
    const providers = await withTimeout(getIntegrationStatus(), CHECK_TIMEOUT_MS);
    const connected = providers.filter((p) => p.connected).length;
    const detail = `${connected}/${providers.length} providers connected`;
    if (providers.length === 0 || connected === 0) {
      return { id: "ai", name: "AI engine", status: "down", detail: "no provider connected" };
    }
    return { id: "ai", name: "AI engine", status: connected < providers.length ? "degraded" : "ok", detail };
  } catch (err) {
    return { id: "ai", name: "AI engine", status: "down", detail: errMsg(err) };
  }
}

/** Null when Redis isn't configured: in-process pub/sub, so there is nothing to check. */
async function checkRedis(): Promise<HealthCheck | null> {
  if (!redisConfigured()) return null;
  try {
    const ms = await withTimeout(pingRedis(), CHECK_TIMEOUT_MS);
    return {
      id: "redis",
      name: "Redis",
      status: ms < 100 ? "ok" : ms < 500 ? "degraded" : "down",
      detail: `${ms}ms ping`,
      latencyMs: ms,
    };
  } catch (err) {
    return { id: "redis", name: "Redis", status: "down", detail: errMsg(err) };
  }
}

function checkStorage(): HealthCheck {
  return storageConfigured()
    ? { id: "storage", name: "Attachment storage", status: "ok", detail: "R2 configured" }
    : { id: "storage", name: "Attachment storage", status: "degraded", detail: "R2 not configured" };
}

async function checkProjectDisk(): Promise<HealthCheck> {
  const root = projectsRoot();
  try {
    await access(root, constants.W_OK);
  } catch {
    return { id: "disk", name: "Project disk", status: "down", detail: `${root} not writable` };
  }
  try {
    const s = await statfs(root);
    const freePct = s.blocks > 0 ? (s.bavail / s.blocks) * 100 : 0;
    const freeGb = (s.bavail * s.bsize) / 1024 ** 3;
    return {
      id: "disk",
      name: "Project disk",
      status: freePct < 5 ? "down" : freePct < 15 ? "degraded" : "ok",
      detail: `${freeGb.toFixed(1)} GB free (${Math.round(freePct)}%)`,
    };
  } catch {
    // Writable but free space unknown (unsupported fs): don't fail the check over it.
    return { id: "disk", name: "Project disk", status: "ok", detail: "writable" };
  }
}

function checkEventLoop(): Promise<HealthCheck> {
  const start = process.hrtime.bigint();
  return new Promise((resolve) => {
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1e6;
      const rssMb = Math.round(process.memoryUsage().rss / 1024 ** 2);
      resolve({
        id: "runtime",
        name: "Server runtime",
        status: lag < 100 ? "ok" : lag < 500 ? "degraded" : "down",
        detail: `${lag.toFixed(1)}ms loop lag, ${rssMb} MB`,
        latencyMs: Math.round(lag),
      });
    });
  });
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : "unknown error";
}

export async function getHealthReport(db: Database): Promise<HealthReport> {
  const [database, ai, redis, disk, runtime] = await Promise.all([
    checkDatabase(db),
    checkAiEngine(),
    checkRedis(),
    checkProjectDisk(),
    checkEventLoop(),
  ]);
  const checks = [database, ai, ...(redis ? [redis] : []), checkStorage(), disk, runtime];
  const { score, status } = scoreChecks(checks);
  return {
    ok: status !== "down",
    status,
    score,
    dbMs: database.latencyMs ?? 0,
    uptimeSeconds: Math.floor(process.uptime()),
    checks,
  };
}
