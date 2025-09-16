import { Request, Response } from "express";
import { CSGORaw } from "csgogsi";
import { io } from "../sockets/sockets.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- GSI Recording State ---
interface TimestampedGSIPacket {
  packet: CSGORaw;
  timestamp: number; // milliseconds since recording start
}

interface GSIRecording {
  version: string;
  startTime: number;
  endTime?: number;
  packets: TimestampedGSIPacket[];
}

let isRecording = false;
let recordedPackets: TimestampedGSIPacket[] = [];
let recordStartTime: number | null = null;

// --- Demo Loop State ---
let isDemoLooping = false;
let currentLoopDemo: string | null = null;

// --- Demo Replay State ---
let demoReplayTimeout: NodeJS.Timeout | null = null;
let isDemoPlaying = false;
let currentDemo: GSIRecording | null = null;
let currentPacketIndex = 0;
let playbackSpeed = 1; // 1x speed

// Directory to load/save recorded GSI data
const TESTDATA_DIR = path.resolve(__dirname, "../../../../testdata");

// Schedule the next packet based on recorded timestamps
function scheduleNextPacket(): void {
  if (!currentDemo || !isDemoPlaying) {
    return;
  }

  if (currentPacketIndex >= currentDemo.packets.length) {

    if (isDemoLooping && currentLoopDemo) {
      currentPacketIndex = 0;
      demoReplayTimeout = setTimeout(() => {
        scheduleNextPacket();
      }, 100);
      return;
    } else {
      stopDemoPlayback();
      io.emit("demoFinished");
      return;
    }
  }

  const currentPacket = currentDemo.packets[currentPacketIndex];

  // Send the current packet
  io.emit("update", currentPacket.packet);

  // Emit progress update BEFORE incrementing
  io.emit("demoProgress", {
    currentPacket: currentPacketIndex + 1, // Display 1-based counting
    totalPackets: currentDemo.packets.length,
    progress: ((currentPacketIndex + 1) / currentDemo.packets.length) * 100
  });

  currentPacketIndex++;

  // Schedule next packet if there is one
  if (currentPacketIndex < currentDemo.packets.length) {
    const nextPacket = currentDemo.packets[currentPacketIndex];
    const currentTime = currentPacket.timestamp;
    const nextTime = nextPacket.timestamp;

    let delay = (nextTime - currentTime) / playbackSpeed;

    if (currentTime > nextTime) {
      delay = 100;
    }

    if (playbackSpeed >= 4 && delay < 10) {
      let batchCount = 0;
      const maxBatch = Math.min(10, Math.floor(playbackSpeed / 2));

      while (batchCount < maxBatch && currentPacketIndex < currentDemo.packets.length) {
        const nextBatchPacket = currentDemo.packets[currentPacketIndex];
        io.emit("update", nextBatchPacket.packet);
        currentPacketIndex++;
        batchCount++;

        io.emit("demoProgress", {
          currentPacket: currentPacketIndex,
          totalPackets: currentDemo.packets.length,
          progress: (currentPacketIndex / currentDemo.packets.length) * 100
        });

        if (currentPacketIndex >= currentDemo.packets.length) {
          break;
        }
      }

      delay = Math.max(50, delay);

      if (currentPacketIndex >= currentDemo.packets.length) {
        demoReplayTimeout = setTimeout(() => {
          scheduleNextPacket();
        }, 10);
        return;
      }
    }

    demoReplayTimeout = setTimeout(() => {
      scheduleNextPacket();
    }, Math.max(1, delay));
  }
}

// Ensure testdata directory exists
if (!fs.existsSync(TESTDATA_DIR)) {
  fs.mkdirSync(TESTDATA_DIR, { recursive: true });
}

// Start recording GSI data
export const startGSIRecording = async (req: Request, res: Response): Promise<void> => {
  if (isRecording) {
    res.status(400).json({ error: "Already recording" });
    return;
  }

  isRecording = true;
  recordedPackets = [];
  recordStartTime = Date.now();

  res.json({
    success: true,
    message: "GSI recording started"
  });
};

// Stop recording and save GSI data
export const stopGSIRecording = async (req: Request, res: Response): Promise<void> => {
  if (!isRecording) {
    res.status(400).json({ error: "Not currently recording" });
    return;
  }

  isRecording = false;

  try {
    if (recordedPackets.length === 0) {
      res.status(400).json({ error: "No data recorded" });
      return;
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `gsi-recording-${timestamp}.json`;
    const filePath = path.join(TESTDATA_DIR, filename);

    // Create recording object with metadata
    const recording: GSIRecording = {
      version: "2.0",
      startTime: recordStartTime!,
      endTime: Date.now(),
      packets: recordedPackets
    };

    // Save recorded data
    fs.writeFileSync(filePath, JSON.stringify(recording, null, 2));


    res.json({
      success: true,
      message: `Recording saved with ${recordedPackets.length} packets`,
      filename,
      packetsRecorded: recordedPackets.length
    });
  } catch (err) {
    console.error("Failed to save GSI recording:", err);
    res.status(500).json({ error: "Failed to save GSI recording" });
  } finally {
    recordedPackets = [];
    recordStartTime = null;
  }
};

// Helper to record incoming GSI packets (called from main GSI handler)
export const maybeRecordGSIPacket = (packet: CSGORaw): void => {
  if (isRecording && recordStartTime) {
    const timestampedPacket: TimestampedGSIPacket = {
      packet,
      timestamp: Date.now() - recordStartTime
    };
    recordedPackets.push(timestampedPacket);
  }
};

// Get list of available demo files
export function getAvailableDemos(): string[] {
  if (!fs.existsSync(TESTDATA_DIR)) {
    return [];
  }
  return fs.readdirSync(TESTDATA_DIR).filter((f) => f.endsWith(".json"));
}

// Load a demo file
export function loadDemo(filename: string): GSIRecording {
  const filePath = path.join(TESTDATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Demo file not found: ${filename}`);
  }

  const rawData = JSON.parse(fs.readFileSync(filePath, "utf-8")) as GSIRecording;

  // Validate that it's the correct format
  if (!rawData || typeof rawData !== 'object' || !rawData.version || !rawData.packets) {
    throw new Error(`Invalid demo file format: ${filename}. Only new timestamped format is supported.`);
  }

  return rawData;
}

// Toggle demo loop mode
export const toggleDemoLoop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.body;

    if (isDemoLooping) {
      // Disable looping but keep playing if currently playing
      isDemoLooping = false;
      currentLoopDemo = null;
      res.json({
        success: true,
        message: "Demo loop disabled - demo will stop after current playthrough",
        looping: false,
      });
    } else {
      // Enable looping
      if (!filename) {
        res.status(400).json({ error: "Demo filename is required to start loop" });
        return;
      }

      isDemoLooping = true;
      currentLoopDemo = filename;

      // If not currently playing, start the demo with loop enabled
      if (!isDemoPlaying) {
        currentDemo = loadDemo(filename);
        currentPacketIndex = 0;
        playbackSpeed = 1;
        isDemoPlaying = true;
        scheduleNextPacket();
      }

      res.json({
        success: true,
        message: `Demo loop enabled with: ${filename}`,
        looping: true,
        filename
      });
    }
  } catch (error) {
    console.error("Error toggling demo loop:", error);
    res.status(500).json({
      error: "Failed to toggle demo loop",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Get current demo loop status
export const getDemoLoopStatus = async (req: Request, res: Response): Promise<void> => {
  res.json({
    looping: isDemoLooping,
    filename: currentLoopDemo,
    playing: isDemoPlaying
  });
};

// Get recording status
export const getGSIRecordingStatus = async (req: Request, res: Response): Promise<void> => {
  res.json({
    recording: isRecording,
    packetsRecorded: recordedPackets.length,
    recordStartTime: recordStartTime
  });
};

// Get available demo files
export const getAvailableGSIDemos = async (req: Request, res: Response): Promise<void> => {
  try {
    const demos = getAvailableDemos().map(filename => {
      const filePath = path.join(TESTDATA_DIR, filename);
      const stats = fs.statSync(filePath);
      const data = loadDemo(filename);

      // Calculate duration from recorded timestamps
      let duration = "0s";
      if (data.packets.length > 0) {
        const lastPacket = data.packets[data.packets.length - 1];
        const durationMs = lastPacket.timestamp;
        duration = `${Math.round(durationMs / 1000)}s`;
      }

      return {
        filename,
        size: stats.size,
        created: stats.mtime,
        packetCount: data.packets.length,
        duration,
        hasTimestamps: true // All demos now have timestamps
      };
    });

    res.json({ demos });
  } catch (error) {
    console.error("Error getting demo list:", error);
    res.status(500).json({ error: "Failed to get demo list" });
  }
};

// Start demo playback
export const startDemoPlayback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, speed = 1 } = req.body;

    if (isDemoPlaying) {
      res.status(400).json({ error: "Demo already playing. Stop current demo first." });
      return;
    }

    if (!filename) {
      res.status(400).json({ error: "Demo filename is required" });
      return;
    }

    // Load the demo
    currentDemo = loadDemo(filename);
    currentPacketIndex = 0;
    playbackSpeed = speed;
    isDemoPlaying = true;
    // Playback uses recorded timestamps directly

    // Schedule the first packet
    scheduleNextPacket();


    res.json({
      success: true,
      message: `Demo playback started: ${filename}`,
      packetCount: currentDemo.packets.length,
      speed: playbackSpeed
    });
  } catch (error) {
    console.error("Error starting demo playback:", error);
    res.status(500).json({
      error: "Failed to start demo playback",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Stop demo playback
export const stopDemoPlayback = async (req?: Request, res?: Response): Promise<void> => {
  if (demoReplayTimeout) {
    clearTimeout(demoReplayTimeout);
    demoReplayTimeout = null;
  }

  isDemoPlaying = false;
  isDemoLooping = false;
  currentDemo = null;
  currentLoopDemo = null;
  currentPacketIndex = 0;

  if (res) {
    res.json({
      success: true,
      message: "Demo playback stopped"
    });
  }
};

// Pause/Resume demo playback
export const toggleDemoPlayback = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!currentDemo) {
      res.status(400).json({ error: "No demo currently loaded" });
      return;
    }

    if (demoReplayTimeout) {
      // Currently playing - pause it
      clearTimeout(demoReplayTimeout);
      demoReplayTimeout = null;

      res.json({
        success: true,
        message: "Demo playback paused",
        playing: false
      });
    } else {
      // Currently paused - resume it
      scheduleNextPacket();

      res.json({
        success: true,
        message: "Demo playback resumed",
        playing: true
      });
    }
  } catch (error) {
    console.error("Error toggling demo playback:", error);
    res.status(500).json({ error: "Failed to toggle demo playback" });
  }
};

// Get demo playback status
export const getDemoPlaybackStatus = async (req: Request, res: Response): Promise<void> => {
  res.json({
    playing: isDemoPlaying && demoReplayTimeout !== null,
    loaded: currentDemo !== null,
    currentPacket: currentPacketIndex,
    totalPackets: currentDemo ? currentDemo.packets.length : 0,
    progress: currentDemo ? (currentPacketIndex / currentDemo.packets.length) * 100 : 0,
    speed: playbackSpeed
  });
};

// Delete a demo file
export const deleteDemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.body;

    if (!filename) {
      res.status(400).json({ error: "Demo filename is required" });
      return;
    }

    const filePath = path.join(TESTDATA_DIR, filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Demo file not found" });
      return;
    }

    // Stop current demo if it's the one being deleted
    if (currentDemo && isDemoPlaying) {
      // We'll need to check if this is the same file somehow
      // For now, just stop any current playback to be safe
      await stopDemoPlayback();
    }

    // Delete the file
    fs.unlinkSync(filePath);


    res.json({
      success: true,
      message: `Demo "${filename}" deleted successfully`
    });
  } catch (error) {
    console.error("Error deleting demo:", error);
    res.status(500).json({
      error: "Failed to delete demo",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Change playback speed during playback
export const changePlaybackSpeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { speed } = req.body;

    if (!speed || speed <= 0) {
      res.status(400).json({ error: "Valid speed value is required (greater than 0)" });
      return;
    }

    if (!currentDemo) {
      res.status(400).json({ error: "No demo currently loaded" });
      return;
    }

    // Update the speed
    playbackSpeed = speed;

    // If currently playing, we need to reschedule the next packet with new timing
    if (demoReplayTimeout) {
      clearTimeout(demoReplayTimeout);
      demoReplayTimeout = null;
      scheduleNextPacket();
    }


    res.json({
      success: true,
      message: `Playback speed changed to ${speed}x`,
      speed: playbackSpeed
    });
  } catch (error) {
    console.error("Error changing playback speed:", error);
    res.status(500).json({
      error: "Failed to change playback speed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};