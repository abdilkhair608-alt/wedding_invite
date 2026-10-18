import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export function serverConfig(env = process.env) {
  return {
    filePath: path.resolve(projectRoot, env.RSVP_FILE || '.data/rsvp.json'),
    trustedProxyIps: (env.TRUSTED_PROXY_IPS || '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean),
  };
}
