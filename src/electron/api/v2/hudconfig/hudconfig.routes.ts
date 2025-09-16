import { Router } from "express";
import multer from "multer";
import { 
  listHudsHandler, 
  selectHudHandler, 
  getCurrentHudHandler,
  importHudHandler 
} from "./hudconfig.controller.js";

export const hudConfigRoutes = Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

/* ================== GETs ===================== */
// Get list of available HUDs
hudConfigRoutes.get("/list", listHudsHandler);

// Get currently selected HUD
hudConfigRoutes.get("/current", getCurrentHudHandler);

/* ================== POSTs ===================== */
// Select a HUD
hudConfigRoutes.post("/select", selectHudHandler);

// Import HUD from zip file
hudConfigRoutes.post("/import", upload.single('hudZip'), importHudHandler);