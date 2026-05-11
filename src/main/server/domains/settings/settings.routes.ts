import { Router, Request, Response } from 'express';
import { dbAll, dbRun } from '../../database/sqlite';

const router = Router();

export interface AppSettings {
  autoSwitchSides: boolean;
  telnetHost: string;
  telnetPort: number;
  vmixHost: string;
  vmixPort: number;
  vmixMappings: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoSwitchSides: true,
  telnetHost: '127.0.0.1',
  telnetPort: 2020,
  vmixHost: '127.0.0.1',
  vmixPort: 8088,
  vmixMappings: '[]',
};

// Load all settings from the DB and return as a typed object
export const getSettings = async (): Promise<AppSettings> => {
  const rows: { key: string; value: string }[] = await dbAll('SELECT key, value FROM settings');
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    autoSwitchSides: map.autoSwitchSides !== undefined ? map.autoSwitchSides === 'true' : DEFAULT_SETTINGS.autoSwitchSides,
    telnetHost: map.telnetHost ?? DEFAULT_SETTINGS.telnetHost,
    telnetPort: map.telnetPort !== undefined ? Number(map.telnetPort) : DEFAULT_SETTINGS.telnetPort,
    vmixHost: map.vmixHost ?? DEFAULT_SETTINGS.vmixHost,
    vmixPort: map.vmixPort !== undefined ? Number(map.vmixPort) : DEFAULT_SETTINGS.vmixPort,
    vmixMappings: map.vmixMappings ?? DEFAULT_SETTINGS.vmixMappings,
  };
};

// GET /api/settings — return all settings as a JSON object
router.get('/', async (_req: Request, res: Response) => {
  try {
    res.json(await getSettings());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings — update one or more settings keys
router.put('/', async (req: Request, res: Response) => {
  try {
    const updates: Partial<AppSettings> = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await dbRun(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, String(value)]
      );
    }
    res.json(await getSettings());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
