import { BrowserWindow, screen, globalShortcut } from "electron";
import { getHudPath, getPreloadPath } from "./helpers/index.js";
import { checkDirectories } from "./helpers/util.js";
import path from "path";

let hudWindow: BrowserWindow | null = null;
let isIgnoringMouse = true;

export function createHudWindow() {
  if (hudWindow) {
    hudWindow.focus();
    return hudWindow;
  }

  hudWindow = new BrowserWindow({
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

  checkDirectories();
  hudWindow.loadFile(path.join(getHudPath(), "index.html"));
  hudWindow.setIgnoreMouseEvents(true);
  isIgnoringMouse = true;
  
  // Force the window to stay on top with highest level
  hudWindow.setAlwaysOnTop(true, 'screen-saver');
  
  // Ensure it stays on top when other windows are focused
  hudWindow.on('blur', () => {
    if (hudWindow) {
      hudWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  });

  // Clean up reference when closed
  hudWindow.on('closed', () => {
    hudWindow = null;
  });

  // Add keyboard shortcuts for HUD control
  hudWindow.webContents.on('before-input-event', (event, input) => {
    if (!hudWindow) return;
    
    // Ctrl+Shift+H: Toggle HUD interaction mode
    if (input.control && input.shift && input.key.toLowerCase() === 'h') {
      isIgnoringMouse = !isIgnoringMouse;
      hudWindow.setIgnoreMouseEvents(isIgnoringMouse);
      hudWindow.setFocusable(!isIgnoringMouse);
      if (!isIgnoringMouse) {
        hudWindow.focus();
      }
    }
    
    // Escape: Exit interaction mode
    if (input.key === 'Escape') {
      hudWindow.setIgnoreMouseEvents(true);
      hudWindow.setFocusable(false);
      isIgnoringMouse = true;
    }
    
    // Ctrl+Shift+C: Close HUD
    if (input.control && input.shift && input.key.toLowerCase() === 'c') {
      hudWindow.close();
    }
    
    // Ctrl+Shift+M: Move to next screen
    if (input.control && input.shift && input.key.toLowerCase() === 'm') {
      moveHudToNextScreen();
    }
    
    // Ctrl+Shift+X: Toggle minimize/restore
    if (input.control && input.shift && input.key.toLowerCase() === 'x') {
      if (hudWindow.isMinimized()) {
        hudWindow.restore();
        hudWindow.setAlwaysOnTop(true, 'screen-saver');
      } else {
        hudWindow.minimize();
      }
    }
  });

  return hudWindow;
}

export function moveHudToDisplay(displayIndex: number) {
  if (!hudWindow) return false;
  
  const displays = screen.getAllDisplays();
  if (displayIndex < 0 || displayIndex >= displays.length) return false;
  
  const targetDisplay = displays[displayIndex];
  
  // Move to the target display
  hudWindow.setBounds({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height
  });
  
  return true;
}

export function getAvailableDisplays() {
  const primary = screen.getPrimaryDisplay();
  return screen.getAllDisplays().map((display, index) => ({
    id: index,
    label: `Display ${index + 1} (${display.bounds.width}x${display.bounds.height})${display.id === primary.id ? ' - Primary' : ''}`,
    bounds: display.bounds,
    primary: display.id === primary.id
  }));
}

function moveHudToNextScreen() {
  if (!hudWindow) return;
  
  const displays = screen.getAllDisplays();
  
  if (displays.length <= 1) return;
  
  const currentBounds = hudWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(currentBounds);
  const currentIndex = displays.findIndex(d => d.id === currentDisplay.id);
  const nextIndex = (currentIndex + 1) % displays.length;
  const nextDisplay = displays[nextIndex];
  
  // Move to the next display
  hudWindow.setBounds({
    x: nextDisplay.bounds.x,
    y: nextDisplay.bounds.y,
    width: nextDisplay.bounds.width,
    height: nextDisplay.bounds.height
  });
}

export function getHudWindow() {
  return hudWindow;
}

export function closeHudWindow() {
  if (hudWindow) {
    hudWindow.close();
  }
}

export function getHudStatus() {
  if (!hudWindow) {
    return 'closed';
  }
  
  if (hudWindow.isMinimized()) {
    return 'minimized';
  }
  
  if (hudWindow.isVisible()) {
    return 'visible';
  }
  
  return 'hidden';
}
