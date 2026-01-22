import fs from 'fs/promises';
import path from 'path';
import os from 'os';

interface Config {
  api_key?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.parallel');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export async function getConfig(): Promise<Config> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data) as Config;
  } catch {
    return {};
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export async function getApiKey(): Promise<string | undefined> {
  const config = await getConfig();
  return config.api_key;
}

export async function saveApiKey(apiKey: string): Promise<void> {
  const config = await getConfig();
  config.api_key = apiKey;
  await saveConfig(config);
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
