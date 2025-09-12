import { app, BrowserWindow, Menu, Tray, screen } from "electron";
import path from "path";
import { getAssetPath } from "./helpers/index.js";
import { createHudWindow, getHudWindow, closeHudWindow } from "./hudWindow.js";

export function createTray(mainWindow: BrowserWindow) {
  /* 
  Tray Icon
  to add template icons for mac os: 
  new Tray(path.join(getAssetPath(), process.platform === 'darwin' ? "iconTemplate.png" : "icon.png"));
  */

  const tray = new Tray(path.join(getAssetPath(), "icon.png"));

  const updateTrayMenu = () => {
    const hudWindow = getHudWindow();
    const hudExists = hudWindow !== null;
    const hudVisible = hudExists && hudWindow.isVisible();
    
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Show Main Window",
          click: () => {
            mainWindow.show();
            if (app.dock) {
              app.dock.show();
            }
          },
        },
        { type: "separator" },
        {
          label: "HUD Overlay",
          submenu: [
            {
              label: hudExists ? "Show HUD" : "Start HUD",
              enabled: !hudVisible,
              click: () => {
                if (hudExists) {
                  hudWindow.show();
                } else {
                  const newHudWindow = createHudWindow();
                  newHudWindow.show();
                }
                // Update menu after HUD state changes
                setTimeout(updateTrayMenu, 100);
              },
            },
            {
              label: "Hide HUD",
              enabled: hudVisible,
              click: () => {
                if (hudWindow) {
                  hudWindow.hide();
                }
                setTimeout(updateTrayMenu, 100);
              },
            },
            {
              label: "Close HUD",
              enabled: hudExists,
              click: () => {
                closeHudWindow();
                setTimeout(updateTrayMenu, 100);
              },
            },
            { type: "separator" },
            {
              label: "Move to Next Screen",
              enabled: hudExists,
              click: () => {
                if (hudWindow) {
                  moveHudToNextScreen(hudWindow);
                }
              },
            },
            {
              label: hudExists && hudWindow.isMinimized() ? "Restore HUD" : "Minimize HUD",
              enabled: hudExists,
              click: () => {
                if (hudWindow) {
                  if (hudWindow.isMinimized()) {
                    hudWindow.restore();
                    hudWindow.setAlwaysOnTop(true, 'screen-saver');
                  } else {
                    hudWindow.minimize();
                  }
                }
                setTimeout(updateTrayMenu, 100);
              },
            },
          ],
        },
        { type: "separator" },
        {
          label: "Quit",
          click: () => app.quit(),
        },
      ])
    );
  };

  // Initial menu setup
  updateTrayMenu();
  
  // Update menu every few seconds to keep it current
  setInterval(updateTrayMenu, 2000);
}

function moveHudToNextScreen(hudWindow: BrowserWindow) {
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
