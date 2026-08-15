import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define paths for file-based persistence
const DATA_DIR = path.join(process.cwd(), "app/data");
const FILE_PATH = path.join(DATA_DIR, "visitors.json");

// Ensure global state objects exist
interface GlobalStats {
  totalVisitors: Set<string>;
  activeVisitors: Map<string, number>;
  initialized: boolean;
}

const g = globalThis as unknown as { WariStats: GlobalStats };
if (!g.WariStats) {
  g.WariStats = {
    totalVisitors: new Set(),
    activeVisitors: new Map(),
    initialized: false,
  };
}

const stats = g.WariStats;

// Helper to load total unique visitors from file
function loadTotalVisitors() {
  if (stats.initialized) return;
  try {
    if (fs.existsSync(FILE_PATH)) {
      const fileData = fs.readFileSync(FILE_PATH, "utf8");
      const list = JSON.parse(fileData);
      if (Array.isArray(list)) {
        stats.totalVisitors = new Set(list);
      }
    }
  } catch (err) {
    console.error("Failed to load total visitors from file:", err);
  }
  stats.initialized = true;
}

// Helper to save total unique visitors to file
function saveTotalVisitors() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      FILE_PATH,
      JSON.stringify(Array.from(stats.totalVisitors)),
      "utf8"
    );
  } catch (err) {
    console.error("Failed to save total visitors to file:", err);
  }
}

// Presence timeout of 15 seconds
const TIMEOUT_MS = 15000;

export async function POST(request: Request) {
  loadTotalVisitors();

  let body: { visitorId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { visitorId } = body;
  if (!visitorId) {
    return NextResponse.json({ error: "visitorId is required" }, { status: 400 });
  }

  const now = Date.now();

  // 1. Update unique visitors
  if (!stats.totalVisitors.has(visitorId)) {
    stats.totalVisitors.add(visitorId);
    saveTotalVisitors();
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
    total: stats.totalVisitors.size,
    watching: stats.activeVisitors.size,
  });
}
