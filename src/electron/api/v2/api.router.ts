import { Router } from "express";
import { playersRoutes } from "./players/players.routes.js";
import { matchesRoutes } from "./matches/matches.routes.js";
import { teamsRoutes } from "./teams/teams.routes.js";
import { getMapsHandler } from "./matches/matches.controller.js";
import { tournmentRoutes } from "./tournaments/tournaments.routes.js";
import { HudRoutes } from "./huds/huds.routes.js";
import { hudConfigRoutes } from "./hudconfig/hudconfig.routes.js";
import { readGameData } from "./gsi/gsi.js";
import { gsiStatusRoutes } from "./gsi/gsiStatus.routes.js";
import {
  toggleDemoLoop,
  getDemoLoopStatus,
  startGSIRecording,
  stopGSIRecording,
  getGSIRecordingStatus,
  getAvailableGSIDemos,
  startDemoPlayback,
  stopDemoPlayback,
  toggleDemoPlayback,
  getDemoPlaybackStatus,
  deleteDemo,
  changePlaybackSpeed,
} from "./gsi/testGSI.js";
import { cameraRoutes } from "./cameras/cameras.routes.js";
import { coachRoutes } from "./coaches/coaches.routes.js";

export const APIRouter = Router();

/* eslint-disable react-hooks/rules-of-hooks */
APIRouter.use("/players", playersRoutes);
APIRouter.use("/teams", teamsRoutes);
APIRouter.use("/match", matchesRoutes);
APIRouter.use("/coach", coachRoutes);
APIRouter.use("/tournament", tournmentRoutes);
APIRouter.use("/camera", cameraRoutes);
APIRouter.get("/radar/maps", getMapsHandler);
APIRouter.use("/hud", HudRoutes);
APIRouter.use("/hudconfig", hudConfigRoutes);
APIRouter.use("/gsistatus", gsiStatusRoutes);
APIRouter.post("/gsi", readGameData);
APIRouter.post("/gsi/toggle-loop", toggleDemoLoop);
APIRouter.get("/gsi/loop-status", getDemoLoopStatus);

// GSI Recording endpoints
APIRouter.post("/gsi/record/start", startGSIRecording);
APIRouter.post("/gsi/record/stop", stopGSIRecording);
APIRouter.get("/gsi/record/status", getGSIRecordingStatus);

// Demo Playback endpoints
APIRouter.get("/gsi/demos", getAvailableGSIDemos);
APIRouter.post("/gsi/demo/start", startDemoPlayback);
APIRouter.post("/gsi/demo/stop", stopDemoPlayback);
APIRouter.post("/gsi/demo/toggle", toggleDemoPlayback);
APIRouter.get("/gsi/demo/status", getDemoPlaybackStatus);
APIRouter.post("/gsi/demo/delete", deleteDemo);
APIRouter.post("/gsi/demo/speed", changePlaybackSpeed);
