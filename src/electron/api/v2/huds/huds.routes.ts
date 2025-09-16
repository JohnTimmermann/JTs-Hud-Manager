/* eslint-disable react-hooks/rules-of-hooks */
import { Router, Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { getHudPath } from "../../../helpers/pathResolver.js";
export const HudRoutes = Router();

/* ================== GETs ===================== */
// Dynamic static file serving that respects HUD selection
HudRoutes.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hudPath = await getHudPath();
    const requestedPath = req.path;
    
    // Skip for the root path, let the specific handler deal with it
    if (requestedPath === '/') {
      return next();
    }
    
    const filePath = path.join(hudPath, requestedPath);
    
    //console.log(`HUD Asset request: ${requestedPath} -> ${filePath}`);
    
    // Check if the file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      // Set proper MIME type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject'
      };
      
      if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
      }
      
      return res.sendFile(filePath);
    }
    
    console.log(`HUD Asset not found: ${filePath}`);
    next();
  } catch (error) {
    console.error("Error serving HUD static files:", error);
    next();
  }
});

HudRoutes.get("/", async (req, res) => {
  try {
    const hudPath = await getHudPath();
    const indexPath = path.join(hudPath, "index.html");
    
    // Read the HTML file
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Fix asset paths to be relative to /api/hud/ instead of relative to root
    htmlContent = htmlContent.replace(/src="\.\/assets\//g, 'src="/api/hud/assets/');
    htmlContent = htmlContent.replace(/href="\.\/assets\//g, 'href="/api/hud/assets/');
    
    // Inject socket.io script for browser source refresh
    const socketScript = `
<script src="/socket.io/socket.io.js"></script>
<script>
  // Connect to socket.io for HUD refresh capability
  const socket = io();
  socket.on('forceReload', () => {
    console.log('HUD refresh requested - reloading page...');
    window.location.reload();
  });
  
  // Also listen for refreshHUD event as backup
  socket.on('refreshHUD', () => {
    console.log('HUD refresh signal received - reloading page...');
    window.location.reload();
  });
</script>`;
    
    // Inject the script before closing </body> tag
    htmlContent = htmlContent.replace('</body>', `${socketScript}\n</body>`);
    
    // Send the modified HTML
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlContent);
  } catch (error) {
    console.error("Error serving HUD:", error);
    res.status(500).send("Error loading HUD");
  }
});

/* ================== POSTs ===================== */

/* ================== PUTs ===================== */
