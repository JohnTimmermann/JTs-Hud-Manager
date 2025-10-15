import sqlite3 from "sqlite3";
import { getDatabasePath } from "../helpers/pathResolver.js";

/* Initialize the SQLite database with tables */
export const database = new sqlite3.Database(getDatabasePath(), (error) => {
  if (error) {
    console.log(error);
  }

  /* Enable foreign key constraints */
  database.run("PRAGMA foreign_keys = ON");

  database.serialize(() => {
    /* Create teams table first (since players references it) */
    database.run(
      `CREATE TABLE IF NOT EXISTS teams (
        _id TEXT PRIMARY KEY NOT NULL UNIQUE,
        name TEXT NOT NULL,
        country TEXT,
        shortName TEXT,
        logo TEXT,
        extra TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (error) => {
        if (error) {
          console.error("Error creating teams table:", error.message);
        }
      },
    );

    database.run(`
    CREATE TRIGGER IF NOT EXISTS update_teams_updatedAt
    AFTER UPDATE ON teams
    FOR EACH ROW
    BEGIN
        UPDATE teams SET updatedAt = CURRENT_TIMESTAMP WHERE _id = OLD._id;
    END;
  `);

    /* Create players table */
    database.run(
      `CREATE TABLE IF NOT EXISTS players (
        _id TEXT PRIMARY KEY NOT NULL UNIQUE,
        firstName TEXT,
        lastName TEXT,
        username TEXT NOT NULL,
        avatar TEXT,
        country TEXT,
        steamid TEXT NOT NULL UNIQUE,
        team TEXT,
        extra TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team) REFERENCES teams(_id) ON DELETE SET NULL
      )`,
      (error) => {
        if (error) {
          console.error("Error creating players table:", error.message);
        }
      },
    );

    database.run(`
    CREATE TRIGGER IF NOT EXISTS update_players_updatedAt
    AFTER UPDATE ON players
    FOR EACH ROW
    BEGIN
        UPDATE players SET updatedAt = CURRENT_TIMESTAMP WHERE _id = OLD._id;
    END;
  `);

    /* Create matches table */
    database.run(
      `CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY NOT NULL UNIQUE,
        current INTEGER DEFAULT 0 CHECK (current IN (0, 1)),
        left_id TEXT,
        left_wins INTEGER DEFAULT 0 CHECK (left_wins BETWEEN 0 AND 5),
        right_id TEXT,
        right_wins INTEGER DEFAULT 0 CHECK (right_wins BETWEEN 0 AND 5),
        matchType TEXT NOT NULL CHECK (matchType IN ('bo1', 'bo2', 'bo3', 'bo5')),
        vetos TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (left_id) REFERENCES teams(_id) ON DELETE SET NULL,
        FOREIGN KEY (right_id) REFERENCES teams(_id) ON DELETE SET NULL,
        CHECK (left_id != right_id)
      )`,
      (error) => {
        if (error) {
          console.error("Error creating players table:", error.message);
        }
      },
    );

    database.run(`
    CREATE TRIGGER IF NOT EXISTS update_matches_updatedAt
    AFTER UPDATE ON matches
    FOR EACH ROW
    BEGIN
        UPDATE matches SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);

    /* Create coaches table */
    database.run(
      `CREATE TABLE IF NOT EXISTS coaches (
        steamid TEXT PRIMARY KEY NOT NULL UNIQUE,
        name TEXT,
        team TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team) REFERENCES teams(_id) ON DELETE SET NULL
      )`,
    (error) => {
      if (error) {
        console.error("Error creating coaches table:", error.message);
      }
    },
  );

    database.run(`
    CREATE TRIGGER IF NOT EXISTS update_coaches_updatedAt
    AFTER UPDATE ON coaches
    FOR EACH ROW
    BEGIN
        UPDATE coaches SET updatedAt = CURRENT_TIMESTAMP WHERE steamid = OLD.steamid;
    END;
  `);
    
    
      /* Create hud_config table */
  database.run(
    `CREATE TABLE IF NOT EXISTS hud_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        selected_hud TEXT
      )`,
    (error) => {
      if (error) {
        console.error("Error creating hud_config table:", error.message);
      }
    },
  );
      (error) => {
        if (error) {
          console.error("Error creating coaches table:", error.message);
        }
      },
    );
  });
});
