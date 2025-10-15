import { app, BrowserWindow } from "electron";
import {
  checkDirectories,
  isDev,
  getPreloadPath,
  getUIPath,
} from "./helpers/index.js";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";
import { ipcMainEvents } from "./ipcEvents/index.js";
import { closeServer, startServer } from "./index.js";
import { closeAllWindows } from "./hudWindow.js";

let mainWindow: BrowserWindow;

app.on("ready", () => {
  mainWindow = createMainWindow();
  createMenu(mainWindow);
  checkDirectories();
  startServer();
  createTray();
  ipcMainEvents(mainWindow);

  mainWindow.on("close", () => {
    closeAllWindows();
    closeServer();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    minWidth: 800,
    height: 700,
    minHeight: 513,
    frame: false,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(getUIPath());
  }

  return mainWindow;
}

