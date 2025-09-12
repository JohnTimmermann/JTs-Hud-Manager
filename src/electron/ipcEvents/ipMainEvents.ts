import { BrowserWindow, shell } from "electron";
import {
  ipcMainHandle,
  ipcMainOn,
  openHudsDirectory,
} from "../helpers/index.js";
import { createHudWindow, getHudWindow, closeHudWindow, moveHudToDisplay, getAvailableDisplays, getHudStatus } from "../hudWindow.js";
import { getPlayers } from "../server/services/index.js";
// Handle expects a response
export function ipcMainEvents(mainWindow: BrowserWindow) {
  ipcMainHandle("getPlayers", async () => {
    const players = await getPlayers();
    return players;
  });

  ipcMainOn("sendFrameAction", (payload) => {
    switch (payload) {
      case "CLOSE":
        mainWindow.close();
        break;
      case "MINIMIZE":
        mainWindow.minimize();
        break;
      case "MAXIMIZE":
        mainWindow.maximize();
        break;
      case "CONSOLE":
        mainWindow.webContents.toggleDevTools();
        break;
      case "RESET":
        mainWindow.unmaximize();
        break;
    }
  });

  ipcMainOn("startOverlay", () => {
    const hudWindow = createHudWindow();
    hudWindow.show();
  });

  ipcMainOn("closeOverlay", () => {
    closeHudWindow();
  });

  ipcMainOn("toggleOverlay", () => {
    const hudWindow = getHudWindow();
    if (hudWindow) {
      if (hudWindow.isVisible()) {
        hudWindow.hide();
      } else {
        hudWindow.show();
      }
    } else {
      const newHudWindow = createHudWindow();
      newHudWindow.show();
    }
  });

  ipcMainOn("openExternalLink", (url) => {
    shell.openExternal(url);
  });

  ipcMainOn("openHudsDirectory", () => {
    openHudsDirectory();
  });

  // HUD display management  
  ipcMainHandle("getDisplays", () => {
    return getAvailableDisplays();
  });

  ipcMainOn("moveHudToDisplay", (displayIndex: number) => {
    moveHudToDisplay(displayIndex);
  });

  ipcMainHandle("getHudStatus", () => {
    return getHudStatus();
  });
}
