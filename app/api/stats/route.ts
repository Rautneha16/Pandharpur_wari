import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define paths for file-based persistence
const DATA_DIR = path.join(process.cwd(), "app/data");
const FILE_PATH = path.join(DATA_DIR, "visitors.json");

// Ensure global state objects exist
interface GlobalStats {
  totalVisits: number;
  activeVisitors: Map<string, number>;
  initialized: boolean;
}

const g = globalThis as unknown as { WariStats: GlobalStats };
if (!g.WariStats) {
  g.WariStats = {
    totalVisits: 0,
    activeVisitors: new Map(),
    initialized: false,
  };
}

const stats = g.WariStats;
if (typeof stats.totalVisits !== "number" || isNaN(stats.totalVisits)) {
  stats.totalVisits = 0;
  stats.initialized = false;
}

// Helper to load total visits from file with backwards compatibility
function loadTotalVisits() {
  if (stats.initialized) return;
  try {
    if (fs.existsSync(FILE_PATH)) {
      const fileData = fs.readFileSync(FILE_PATH, "utf8");
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed)) {
        // Backwards compatibility migration: count of unique visitors Set array
        stats.totalVisits = parsed.length;
      } else if (parsed && typeof parsed === "object") {
        if (typeof parsed.totalVisits === "number" && !isNaN(parsed.totalVisits)) {
          stats.totalVisits = parsed.totalVisits;
        } else {
          stats.totalVisits = 0;
        }
      }
    }
  } catch (err) {
    console.error("Failed to load total visits from file:", err);
  }
  stats.initialized = true;
  // Final sanity check
  if (typeof stats.totalVisits !== "number" || isNaN(stats.totalVisits)) {
    stats.totalVisits = 0;
  }
}

// Queue-based sequential file saver to prevent concurrent file I/O write races
let writeQueue = Promise.resolve();

function saveTotalVisits(total: number) {
  writeQueue = writeQueue.then(() => {
    return new Promise<void>((resolve) => {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(
          FILE_PATH,
          JSON.stringify({ totalVisits: total }),
          "utf8"
        );
      } catch (err) {
        console.error("Failed to save total visits to file:", err);
      }
      resolve();
    });
  });
}

// Presence timeout of 15 seconds
const TIMEOUT_MS = 15000;

export async function POST(request: Request) {
  loadTotalVisits();

  let body: { visitorId?: string; isNewVisit?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { visitorId, isNewVisit } = body;
  if (!visitorId) {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
  }

  const now = Date.now();

  // 1. Update visits counter (atomic in-memory single-thread increment)
  if (isNewVisit) {
    stats.totalVisits += 1;
    saveTotalVisits(stats.totalVisits);
  }

  // 2. Update active heartbeat presence
  stats.activeVisitors.set(visitorId, now);

  // 3. Clean up inactive visitors
  for (const [id, timestamp] of stats.activeVisitors.entries()) {
    if (now - timestamp > TIMEOUT_MS) {
      stats.activeVisitors.delete(id);
    }
  }

  return NextResponse.json({
    total: stats.totalVisits,
    watching: stats.activeVisitors.size,
  });
}
