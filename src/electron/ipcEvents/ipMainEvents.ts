import { BrowserWindow, shell } from "electron";
import {
  ipcMainHandle,
  ipcMainHandleWithParam,
  ipcMainOn,
  openHudsDirectory,
} from "../helpers/index.js";
import { 
  createHudWindow, 
  toggleHudVisibility, 
  moveHudToDisplay, 
  toggleInteractiveMode, 
  getHudStatus, 
  getAllDisplays,
  forceCloseHud
} from "../hudWindow.js";
import * as PlayersModel from "../api/v2/players/players.data.js";
// Handle expects a response
export function ipcMainEvents(mainWindow: BrowserWindow) {
  ipcMainHandle("getPlayers", async () => {
    const players = await PlayersModel.selectAll();
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

  ipcMainOn("startOverlay", (displayId?: number) => {
    createHudWindow(displayId);
  });

  ipcMainOn("openExternalLink", (url) => {
    shell.openExternal(url);
  });

  ipcMainOn("openHudsDirectory", () => {
    openHudsDirectory();
  });

  // HUD Management Events
  ipcMainHandle("getHudStatus", () => {
    return getHudStatus();
  });

  ipcMainHandle("getAllDisplays", () => {
    return getAllDisplays();
  });

  ipcMainHandle("toggleHudVisibility", () => {
    return toggleHudVisibility();
  });

  ipcMainHandleWithParam("moveHudToDisplay", (displayId: number) => {
    return moveHudToDisplay(displayId);
  });

  ipcMainHandle("toggleInteractiveMode", () => {
    return toggleInteractiveMode();
  });

  ipcMainHandle("forceCloseHud", () => {
    return forceCloseHud();
  });
}
