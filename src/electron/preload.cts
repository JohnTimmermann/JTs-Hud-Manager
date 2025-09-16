const electron = require("electron");

/* context bridge used to bridge data between electron process and main window  */
/* These functions will be loaded before the mainWindow is opened  */

electron.contextBridge.exposeInMainWorld("electron", {
  // On doesn't care if anyone is listeneing
  // Invoke Expects a return value

  startServer: (callback: (message: any) => void) =>
    ipcOn("startServer", (response) => {
      callback(response);
    }),

  sendFrameAction: (payload) => {
    ipcSend("sendFrameAction", payload);
  },

  startOverlay: (displayId?: number) => ipcSend("startOverlay", displayId),
  openExternalLink: (url) => ipcSend("openExternalLink", url),
  openHudsDirectory: () => ipcSend("openHudsDirectory", undefined),
  getHudStatus: () => ipcInvoke("getHudStatus"),
  getAllDisplays: () => ipcInvoke("getAllDisplays"),
  toggleHudVisibility: () => ipcInvoke("toggleHudVisibility"),
  moveHudToDisplay: (displayId) => ipcInvoke("moveHudToDisplay", displayId),
  toggleInteractiveMode: () => ipcInvoke("toggleInteractiveMode"),
  forceCloseHud: () => ipcInvoke("forceCloseHud"),
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
  ...args: any[]
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key, ...args);
}

/* Using callbacks because these functions are async */
function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void,
) {
  electron.ipcRenderer.on(key, (_, payload) => callback(payload));
}

function ipcSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload: EventPayloadMapping[Key],
) {
  electron.ipcRenderer.send(key, payload);
}
