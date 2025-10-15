import path from "path";
import { app } from "electron";
import fs from "fs";
import { isDev } from "./util.js";
import { database } from "../configs/database.js";

interface HudConfigRow {
  selected_hud: string | null;
}

/* Determine preload path based on if we are in dev */
export function getPreloadPath() {
  return path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "/dist-electron/preload.cjs",
  );
}

// Path to our database file (stored in appdata for openhud)
export function getDatabasePath() {
  return path.join(app.getPath("userData"), "database.v1.db");
}

// Needed for verifying URL
export function getUIPath() {
  return path.join(app.getAppPath() + "/dist-react/index.html");
}

// Path for Assets (images, icons, ect)
export function getAssetPath() {
  return path.join(app.getAppPath(), isDev() ? "." : "..", "/src/assets");
}

export function getCustomHudPath() {
  return path.join(app.getPath("home"), "OpenHud-Huds/build");
}

// Default HUD path
export function getDefaultHUDPath() {
  return path.join(
    app.getAppPath(),
    isDev() ? "." : "..",
    "/src/assets/defaultHudv2",
  );
}

/* Get the currently selected HUD path, falling back to default logic */
export function getHudPath(): Promise<string> {
  return new Promise((resolve) => {
    // Check if there's a selected HUD in the database
    database.get(
      "SELECT selected_hud FROM hud_config WHERE id = 1",
      (error, row: HudConfigRow | undefined) => {
        console.log("getHudPath - Database query result:", { error, row, selected_hud: row?.selected_hud });

        if (error || !row || row.selected_hud === null || row.selected_hud === undefined) {
          // Fall back to original logic
          console.log("getHudPath - No database selection, falling back to original logic");
          const customIndex = path.join(
            app.getPath("home"),
            "OpenHud-Huds",
            "build",
            "index.html",
          );
          if (fs.existsSync(customIndex)) {
            console.log("getHudPath - Using custom HUD (fallback):", getCustomHudPath());
            resolve(getCustomHudPath());
          } else {
            console.log("getHudPath - Using default HUD (fallback):", getDefaultHUDPath());
            resolve(getDefaultHUDPath());
          }
          return;
        }

        // Check if default HUD is selected (empty string means default)
        if (row.selected_hud === "") {
          console.log("Default HUD selected, using default path:", getDefaultHUDPath());
          resolve(getDefaultHUDPath());
          return;
        }

        // Use selected custom HUD
        const selectedHudPath = path.join(
          app.getPath("home"),
          "OpenHud-Huds",
          row.selected_hud
        );
                
        // Verify the selected HUD still exists
        if (fs.existsSync(selectedHudPath) && fs.existsSync(path.join(selectedHudPath, "index.html"))) {
          resolve(selectedHudPath);
        } else {
          // Selected HUD doesn't exist, fall back to default logic
          const customIndex = path.join(
            app.getPath("home"),
            "OpenHud-Huds",
            "build",
            "index.html",
          );
          if (fs.existsSync(customIndex)) {
            resolve(getCustomHudPath());
          } else {
            resolve(getDefaultHUDPath());
          }
        }
      }
    );
  });
}

/* Synchronous version for backwards compatibility */
export function getHudPathSync() {
  // Fall back to original logic for synchronous calls
  const customIndex = path.join(
    app.getPath("home"),
    "OpenHud-Huds",
    "build",
    "index.html",
  );
  if (fs.existsSync(customIndex)) {
    return getCustomHudPath();
  }
  return getDefaultHUDPath();
}

// Path for uploads folder
export function getUploadsPath() {
  return path.join(app.getPath("userData"), "uploads");
}

// Path for player pictures (in uploads folder)
export function getPlayerPicturesPath() {
  return path.join(getUploadsPath(), "player_pictures");
}

// Path for team logos (in uploads folder)
export function getTeamLogosPath() {
  return path.join(getUploadsPath(), "team_logos");
}
