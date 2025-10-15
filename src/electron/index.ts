import express from "express";
import cors from "cors";
import { createServer, Server } from "http";
import { APIRouter } from "./api/v2/api.router.js";
import { initHudWatcher } from "./api/v2/hudconfig/hudconfig.controller.js";
import { initializeWebSocket, io } from "./api/v2/sockets/sockets.js";
import { DevRouter } from "./configs/dev.js";
import { checkDirectories } from "./api/v2/helpers/utilities.js";

export const PORT = process.env.PORT || "1349";
export const expressApp = express();
export const server: Server = createServer(expressApp);

export const apiUrl = `localhost:${PORT}`;

export let isDevMode = false;
export function setDevMode(enabled: boolean) {
  isDevMode = enabled;
  console.log(`Dev mode ${enabled ? 'enabled' : 'disabled'}`);
}

export const startServer = () => {
  initializeWebSocket(server);
  initHudWatcher();
  checkDirectories();

  expressApp.use(cors());
  expressApp.use(express.json());
  expressApp.use((req, res, next) => {
    if (isDevMode && (req.path === '/api/hud' || req.path.startsWith('/api/hud/') || req.path === '/hud' || req.path.startsWith('/hud/'))) {
      let targetPath = req.path;
      if (req.path.startsWith('/api/hud')) {
        targetPath = req.path.replace('/api/hud', '');
        if (!targetPath) targetPath = '/';
      }

      const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
      const devUrl = `http://localhost:3500${targetPath}${queryString}`;
      return res.redirect(devUrl);
    }
    next();
  });

  expressApp.use("/api", APIRouter);
  expressApp.use("/development", DevRouter);
  server.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
  });
};

export const closeServer = () => {
  if (io) {
    io.close();
  }
  server.close(() => {
    console.log("Server closed");
  });
};

