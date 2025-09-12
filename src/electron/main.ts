import { app, BrowserWindow, globalShortcut } from "electron";
import {
  checkDirectories,
  isDev,
  showNotification,
  getPreloadPath,
  getUIPath,
} from "./helpers/index.js";
import { shutDown, startServer } from "./server/server.js";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";
import { getHudWindow, closeHudWindow } from "./hudWindow.js";
import http from "http";
import { ipcMainEvents } from "./ipcEvents/index.js";

let server: http.Server;
let mainWindow: BrowserWindow;

app.on("ready", () => {
  mainWindow = createMainWindow();
  checkDirectories();
  server = startServer(mainWindow);
  createTray(mainWindow);
  createMenu(mainWindow);
  handleCloseEvents(mainWindow);
  ipcMainEvents(mainWindow);
  registerGlobalHudShortcuts();
});

app.on("will-quit", () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
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

function handleCloseEvents(mainWindow: BrowserWindow) {
  /* Handle minimizing to tray */
  let willClose = false;

  mainWindow.on("close", (e) => {
    if (willClose) {
      return;
    }
    e.preventDefault();
    showNotification("Application still running but minimized to tray");
    mainWindow.hide();
    if (app.dock) {
      app.dock.hide();
    }
  });

  // Reset willClose when we open the app from the tray again
  app.on("before-quit", () => {
    willClose = true;
    shutDown(server);
  });

  mainWindow.on("show", () => {
    willClose = false;
  });
}

function registerGlobalHudShortcuts() {
  // Register global shortcuts for HUD control
  try {
    // Ctrl+Alt+H: Focus HUD (makes it interactive)
    globalShortcut.register('CommandOrControl+Alt+H', () => {
      const hudWindow = getHudWindow();
      if (hudWindow) {
        hudWindow.setIgnoreMouseEvents(false);
        hudWindow.setFocusable(true);
        hudWindow.focus();
        hudWindow.webContents.executeJavaScript(`
          console.log('HUD is now interactive - use Ctrl+Shift+C to close, Escape to return to click-through');
        `);
      }
    });

    // Ctrl+Alt+C: Close HUD
    globalShortcut.register('CommandOrControl+Alt+C', () => {
      closeHudWindow();
    });

    // Ctrl+Alt+X: Toggle HUD visibility
    globalShortcut.register('CommandOrControl+Alt+X', () => {
      const hudWindow = getHudWindow();
      if (hudWindow) {
        if (hudWindow.isVisible()) {
          hudWindow.hide();
        } else {
          hudWindow.show();
        }
      }
    });

    console.log('Global HUD shortcuts registered:');
    console.log('- Ctrl+Alt+H: Focus HUD (make interactive)');
    console.log('- Ctrl+Alt+C: Close HUD');  
    console.log('- Ctrl+Alt+X: Toggle HUD visibility');
    
  } catch (error) {
    console.error('Failed to register global shortcuts:', error);
  }
}
