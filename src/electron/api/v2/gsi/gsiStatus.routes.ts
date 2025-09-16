import { Router, Request, Response } from "express";
import { gsiStatusMonitor } from "./gsiStatus.js";
import path from "path";
import { app } from "electron";
import fs from "fs";
import { getAssetPath } from "../../../helpers/pathResolver.js";

export const gsiStatusRoutes = Router();

// Get current GSI status
gsiStatusRoutes.get("/status", (req: Request, res: Response): void => {
  const status = gsiStatusMonitor.getStatus();
  const statusText = gsiStatusMonitor.getStatusText();
  
  res.json({
    ...status,
    statusText,
    configFileInstalled: checkConfigFileInstalled()
  });
});

// Reset GSI statistics
gsiStatusRoutes.post("/reset", (req: Request, res: Response): void => {
  gsiStatusMonitor.reset();
  res.json({ message: "GSI statistics reset successfully" });
});

// Force reinstall GSI config file
gsiStatusRoutes.post("/reinstall", (req: Request, res: Response): void => {
  try {
    const result = installGSIConfig();
    if (result.success) {
      res.json({
        message: "GSI config file installed successfully",
        installedTo: result.installedTo
      });
    } else {
      res.status(400).json({
        error: "Failed to install GSI config file",
        details: result.error
      });
    }
  } catch (error) {
    console.error("Error during GSI config installation:", error);
    res.status(500).json({
      error: "Internal server error during GSI config installation",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Check if CS2 config file is installed
gsiStatusRoutes.get("/config-status", (req: Request, res: Response): void => {
  const configInstalled = checkConfigFileInstalled();
  const configPaths = getCS2ConfigPaths();
  
  res.json({
    configInstalled,
    configPaths,
    expectedFileName: "gamestate_integration_openhud.cfg"
  });
});

// Helper function to check if config file is installed
function checkConfigFileInstalled(): boolean {
  const configPaths = getCS2ConfigPaths();
  
  for (const configPath of configPaths) {
    const fullPath = path.join(configPath, "gamestate_integration_openhud.cfg");
    if (fs.existsSync(fullPath)) {
      return true;
    }
  }
  
  return false;
}

// Helper function to get possible CS2 config paths
function getCS2ConfigPaths(): string[] {
  const userHome = app.getPath("home");
  const steamPaths = [
    // Default Steam path
    path.join(userHome, "Steam", "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo", "cfg"),
    // Alternative Steam paths
    path.join("C:", "Program Files (x86)", "Steam", "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo", "cfg"),
    path.join("C:", "Program Files", "Steam", "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo", "cfg"),
    // Alternative drive locations
    path.join("D:", "Steam", "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo", "cfg"),
    path.join("E:", "Steam", "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo", "cfg"),
  ];
  
  // Filter to only return paths that exist
  return steamPaths.filter(steamPath => fs.existsSync(path.dirname(steamPath)));
}

function installGSIConfig(): { success: boolean; installedTo?: string; error?: string } {
  const configPaths = getCS2ConfigPaths();
  
  if (configPaths.length === 0) {
    return {
      success: false,
      error: "No CS2 installation found. Please make sure Counter-Strike 2 is installed via Steam."
    };
  }
  
  // Try to get the GSI config template
  const sourceConfigPath = path.join(getAssetPath(), "gamestate_integration_openhud.cfg");
  
  if (!fs.existsSync(sourceConfigPath)) {
    return {
      success: false,
      error: "GSI config template file not found in application assets."
    };
  }
  
  // Read the template file
  const configContent = fs.readFileSync(sourceConfigPath, 'utf8');
  
  // Try to install to the first available CS2 config path
  for (const configPath of configPaths) {
    try {
      const targetPath = path.join(configPath, "gamestate_integration_openhud.cfg");
      
      // Create the directory if it doesn't exist
      fs.mkdirSync(configPath, { recursive: true });
      
      // Write the config file (this will overwrite if it exists)
      fs.writeFileSync(targetPath, configContent, 'utf8');
      
      console.log(`GSI config installed successfully to: ${targetPath}`);
      
      return {
        success: true,
        installedTo: targetPath
      };
    } catch (error) {
      console.error(`Failed to install GSI config to ${configPath}:`, error);
      continue; // Try next path
    }
  }
  
  return {
    success: false,
    error: "Failed to install GSI config file to any CS2 installation directory. Check file permissions."
  };
}