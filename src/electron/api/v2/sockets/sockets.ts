import { Server } from "socket.io";
import http from "http";
import { hudWindow } from "../../../hudWindow.js";
import { setDevHudAvailable } from "../hudconfig/hudconfig.controller.js";
import { apiUrl } from "../../../index.js";

export let io: Server;
let devHudMonitorInterval: NodeJS.Timeout | null = null;

/**
 * Initialize a socketio websocket server.
 */
export function initializeWebSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  startDevHudMonitoring();

  io.on("connection", (socket) => {
    socket.emit("update", { data: "Initial data from server" });

    socket.on("match", () => {
      console.log("test");
    });

    socket.on("refreshHUD", () => {
      if (hudWindow && !hudWindow.isDestroyed()) {
        const hudUrl = "http://" + apiUrl + "/hud";
        hudWindow.loadURL(hudUrl);
      }
      io.emit("refreshHUD");
      io.emit("forceReload");
    });

    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });

  return io;
}

function startDevHudMonitoring(): void {
  if (devHudMonitorInterval) {
    clearInterval(devHudMonitorInterval);
  }

  devHudMonitorInterval = setInterval(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      await fetch('http://localhost:3500', {
        signal: controller.signal,
        method: 'HEAD'
      });

      clearTimeout(timeoutId);
      setDevHudAvailable(true);
    } catch {
      setDevHudAvailable(false);
    }
  }, 3000);
}
