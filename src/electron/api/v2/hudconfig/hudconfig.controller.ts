import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { app } from "electron";
import { database } from "../../../configs/database.js";
import AdmZip from "adm-zip";
import { io } from "../sockets/sockets.js";
import { setDevMode } from "../../../index.js";

interface HudInfo {
  name: string;
  directory: string;
  configPath: string;
}

interface HudConfig {
  name: string;
  [key: string]: unknown;
}

interface DatabaseRow {
  selected_hud: string;
}

// Track dev HUD availability
let isDevHudAvailable = false;

// Get the OpenHud-Huds directory path
function getHudsDirectory(): string {
  return path.join(app.getPath("home"), "OpenHud-Huds");
}

// Initialize file system watcher for HUD folder
export function initHudWatcher(): void {
  const hudsDir = getHudsDirectory();

  if (!fs.existsSync(hudsDir)) {
    fs.mkdirSync(hudsDir, { recursive: true });
  }

  try {
    fs.watch(hudsDir, { recursive: true }, (eventType, filename) => {
      setTimeout(() => {
        io?.emit("hudListChanged");
      }, 500);
    });
  } catch (error) {
    console.error("Failed to initialize HUD watcher:", error);
  }
}

// Parse hud.json content (JSON or JWT format)
function parseHudConfig(content: string): HudConfig {
  try {
    return JSON.parse(content) as HudConfig;
  } catch {
    // Try JWT format
    try {
      const parts = content.split('.');
      if (parts.length === 3) {
        const payload = parts[1];
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf-8');
        return JSON.parse(decodedPayload) as HudConfig;
      }
    } catch (jwtError) {
      console.error("JWT parse failed:", jwtError);
    }
    throw new Error("Invalid hud.json format");
  }
}

// Set dev HUD availability status
export function setDevHudAvailable(available: boolean): void {
  if (isDevHudAvailable !== available) {
    isDevHudAvailable = available;
    io?.emit("devHudStatusChanged", { available });
  }
}

// Search for hud.json files recursively
function findHudConfigs(dirPath: string, relativePath: string = ""): HudInfo[] {
  const hudsList: HudInfo[] = [];

  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const currentRelativePath = relativePath ? path.join(relativePath, item.name) : item.name;

      if (item.isDirectory()) {
        hudsList.push(...findHudConfigs(fullPath, currentRelativePath));
      } else if (item.name === "hud.json") {
        try {
          const fileContent = fs.readFileSync(fullPath, "utf8");
          const hudConfig = parseHudConfig(fileContent);

          if (hudConfig.name) {
            hudsList.push({
              name: hudConfig.name,
              directory: relativePath,
              configPath: fullPath
            });
          }
        } catch (error) {
          console.error(`Error parsing ${fullPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading ${dirPath}:`, error);
  }

  return hudsList;
}

// List all available HUDs
export const listHudsHandler = (req: Request, res: Response): void => {
  try {
    const hudsDir = getHudsDirectory();

    if (!fs.existsSync(hudsDir)) {
      res.json([]);
      return;
    }

    const hudsList = findHudConfigs(hudsDir);

    if (isDevHudAvailable) {
      hudsList.unshift({
        name: "Dev HUD",
        directory: "dev-hud",
        configPath: "http://localhost:3500"
      });
    }

    res.json(hudsList);
  } catch (error) {
    console.error("Error listing HUDs:", error);
    res.status(500).json({ error: "Failed to list HUDs" });
  }
};

// Get currently selected HUD
export const getCurrentHudHandler = (req: Request, res: Response): void => {
  database.get(
    "SELECT * FROM hud_config WHERE id = 1",
    (error, row: DatabaseRow | undefined) => {
      if (error) {
        console.error("Error getting current HUD:", error);
        res.status(500).json({ error: "Failed to get current HUD" });
        return;
      }

      res.json({ selectedHud: row?.selected_hud || null });
    }
  );
};

// Select a HUD
export const selectHudHandler = (req: Request, res: Response): void => {
  const { hudDirectory } = req.body;

  if (hudDirectory === undefined || hudDirectory === null) {
    res.status(400).json({ error: "hudDirectory is required" });
    return;
  }

  // Validate custom HUD exists (skip for default and dev HUD)
  if (hudDirectory !== "" && hudDirectory !== "dev-hud") {
    const hudJsonPath = path.join(getHudsDirectory(), hudDirectory, "hud.json");
    if (!fs.existsSync(hudJsonPath)) {
      res.status(404).json({ error: "HUD not found" });
      return;
    }
  }

  // Validate dev HUD availability
  if (hudDirectory === "dev-hud" && !isDevHudAvailable) {
    res.status(404).json({ error: "Dev HUD not available" });
    return;
  }

  database.run(
    `INSERT OR REPLACE INTO hud_config (id, selected_hud) VALUES (1, ?)`,
    [hudDirectory],
    function(error) {
      if (error) {
        console.error("Error selecting HUD:", error);
        res.status(500).json({ error: "Failed to select HUD" });
        return;
      }

      // Enable/disable dev mode based on selection
      setDevMode(hudDirectory === "dev-hud");

      // Refresh HUD window to load the new selection
      io?.emit("refreshHUD");

      const hudName = hudDirectory === "" ? "Default HUD" : hudDirectory;
      res.json({
        message: `${hudName} selected successfully`,
        selectedHud: hudDirectory
      });
    }
  );
};

// Import HUD from zip file
export const importHudHandler = (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No zip file provided" });
      return;
    }

    const zipPath = req.file.path;
    const hudsDir = getHudsDirectory();

    if (!fs.existsSync(hudsDir)) {
      fs.mkdirSync(hudsDir, { recursive: true });
    }

    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    // Find hud.json to get the HUD name
    let hudConfig: HudConfig | null = null;
    let hudJsonEntry: AdmZip.IZipEntry | null = null;

    for (const entry of zipEntries) {
      if (entry.entryName.endsWith('hud.json') && !entry.isDirectory) {
        try {
          const fileContent = entry.getData().toString('utf8');
          hudConfig = parseHudConfig(fileContent);
          hudJsonEntry = entry;
          break;
        } catch (error) {
          console.error(`Error parsing hud.json from ${entry.entryName}:`, error);
        }
      }
    }

    if (!hudConfig || !hudConfig.name || !hudJsonEntry) {
      fs.unlinkSync(zipPath);
      res.status(400).json({ error: "Invalid HUD zip: missing or invalid hud.json with name field" });
      return;
    }

    const hudName = hudConfig.name;
    const hudDir = path.join(hudsDir, hudName);

    if (fs.existsSync(hudDir)) {
      fs.unlinkSync(zipPath);
      res.status(409).json({ error: `HUD '${hudName}' already exists` });
      return;
    }

    // Extract files, flattening if needed
    const hudJsonPath = hudJsonEntry.entryName;
    const hudJsonDir = path.dirname(hudJsonPath);

    if (hudJsonDir && hudJsonDir !== '.') {
      const tempDir = path.join(hudDir, 'temp');
      zip.extractAllTo(tempDir, true);

      const sourceDir = path.join(tempDir, hudJsonDir);
      if (fs.existsSync(sourceDir)) {
        const files = fs.readdirSync(sourceDir, { recursive: true });
        for (const file of files) {
          const sourcePath = path.join(sourceDir, file as string);
          const targetPath = path.join(hudDir, file as string);

          if (fs.statSync(sourcePath).isFile()) {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.copyFileSync(sourcePath, targetPath);
          }
        }
      }

      fs.rmSync(tempDir, { recursive: true, force: true });
    } else {
      zip.extractAllTo(hudDir, true);
    }

    fs.unlinkSync(zipPath);

    res.json({
      message: "HUD imported successfully",
      hudName: hudName,
      directory: hudName
    });

  } catch (error) {
    console.error("Error importing HUD:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: "Failed to import HUD" });
  }
};