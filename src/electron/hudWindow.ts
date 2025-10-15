import { BrowserWindow, screen } from "electron";
import { getPreloadPath } from "./helpers/index.js";
import { checkDirectories } from "./helpers/util.js";
import { apiUrl } from "./index.js";
import { createMenu } from "./menu.js";

export let hudWindow: BrowserWindow | null = null;

export interface HudStatus {
  isVisible: boolean;
  isMinimized: boolean;
  currentDisplay: number;
  interactiveMode: boolean;
}

const hudStatus: HudStatus = {
  isVisible: false,
  isMinimized: false,
  currentDisplay: 0,
  interactiveMode: false,
};

export function createHudWindow(displayId?: number) {
  // Force close any existing HUD window and wait for it to close
  if (hudWindow && !hudWindow.isDestroyed()) {
    hudWindow.destroy();
    hudWindow = null;
  }

  const displays = screen.getAllDisplays();
  const targetDisplay =
    displayId !== undefined ? displays[displayId] : displays[0];

  if (!targetDisplay) {
    console.error(`Display ${displayId} not found`);
    return null;
  }

  hudWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    fullscreen: true,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    focusable: true,
    frame: false,
    skipTaskbar: true,
    webPreferences: {
      preload: getPreloadPath(),
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  createMenu(hudWindow);
  checkDirectories();

  // Note: The HUD window is always loaded from localhost to avoid CORS issues with local files.
  hudWindow.loadURL("http://" + apiUrl + "/hud");
  hudWindow.setIgnoreMouseEvents(!hudStatus.interactiveMode);

  // Update status
  hudStatus.isVisible = true;
  hudStatus.isMinimized = false;
  hudStatus.currentDisplay = displayId || 0;

  // Focus the HUD window a short time after it's shown to ensure it goes on top.
  hudWindow.on("show", () => {
    setTimeout(() => {
      hudWindow?.focus();
    }, 200);
  });

  hudWindow.on("closed", () => {
    hudWindow = null;
    hudStatus.isVisible = false;
  });

  hudWindow.on("minimize", () => {
    hudStatus.isMinimized = true;
  });

  hudWindow.on("restore", () => {
    hudStatus.isMinimized = false;
  });

  return hudWindow;
}

export function toggleHudVisibility(): boolean {
  if (!hudWindow || hudWindow.isDestroyed()) {
    return false;
  }

  if (hudWindow.isVisible()) {
    hudWindow.hide();
    hudStatus.isVisible = false;
  } else {
    hudWindow.show();
    hudStatus.isVisible = true;
  }

  return hudStatus.isVisible;
}

export function moveHudToDisplay(displayId: number): boolean {
  const displays = screen.getAllDisplays();

  if (displayId >= displays.length || displayId < 0) {
    return false;
  }

  // Force close existing window before creating new one to avoid duplicated HUDs
  if (hudWindow && !hudWindow.isDestroyed()) {
    hudWindow.destroy();
    hudWindow = null;
  }

  createHudWindow(displayId);
  return true;
}

export function toggleInteractiveMode(): boolean {
  if (!hudWindow || hudWindow.isDestroyed()) {
    return false;
  }

  hudStatus.interactiveMode = !hudStatus.interactiveMode;
  hudWindow.setIgnoreMouseEvents(!hudStatus.interactiveMode);

  return hudStatus.interactiveMode;
}

export function getHudStatus(): HudStatus {
  return { ...hudStatus };
}

export function getAllDisplays() {
  return screen.getAllDisplays().map((display, index) => ({
    id: index,
    label: display.label || `Display ${index + 1}`,
    bounds: display.bounds,
    primary: display.bounds.x === 0 && display.bounds.y === 0,
  }));
}

export function forceCloseHud(): boolean {
  if (hudWindow && !hudWindow.isDestroyed()) {
    hudWindow.destroy();
    hudWindow = null;
    hudStatus.isVisible = false;
    hudStatus.isMinimized = false;
    return true;
  }
  return false;
}
