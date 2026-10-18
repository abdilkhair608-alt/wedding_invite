import { createHmac, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function atomicWrite(filePath, content) {
  const temporary = `${filePath}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, 'wx', 0o600);
    fs.writeFileSync(descriptor, content, 'utf8');
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, filePath);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function readState(filePath) {
  const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (
    state?.version !== 1 ||
    !/^[a-f0-9]{64}$/.test(state.secret) ||
    !state.responses ||
    typeof state.responses !== 'object' ||
    Array.isArray(state.responses)
  ) {
    throw new Error('Format file RSVP tidak valid.');
  }
  for (const [key, response] of Object.entries(state.responses)) {
    if (
      !/^[a-f0-9]{64}$/.test(key) ||
      !['attending', 'declined'].includes(response?.attendance) ||
      !Number.isFinite(Date.parse(response.updatedAt))
    ) {
      throw new Error('Isi file RSVP tidak valid.');
    }
  }
  return state;
}

function snapshot(state, ip) {
  const key = createHmac('sha256', state.secret).update(ip).digest('hex');
  const counts = { attending: 0, declined: 0 };
  for (const response of Object.values(state.responses)) counts[response.attendance] += 1;
  return { counts, attendance: state.responses[key]?.attendance ?? null };
}

export function createRsvpStore(filePath) {
  filePath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const backupPath = `${filePath}.backup`;

  try {
    readState(filePath);
  } catch (error) {
    let state;
    if (error.code === 'ENOENT' && !fs.existsSync(backupPath)) {
      state = { version: 1, secret: randomBytes(32).toString('hex'), responses: {} };
    } else {
      try {
        state = readState(backupPath);
      } catch {
        throw new Error('File RSVP dan cadangannya tidak dapat dibaca. Data tidak direset.', {
          cause: error,
        });
      }
    }
    const content = JSON.stringify(state, null, 2);
    atomicWrite(filePath, content);
    atomicWrite(backupPath, content);
  }

  return {
    read(ip) {
      return snapshot(readState(filePath), ip);
    },
    save(ip, attendance) {
      if (!['attending', 'declined'].includes(attendance))
        throw new TypeError('Pilihan tidak valid.');
      // Synchronous writes serialize requests inside this single Node process.
      const state = readState(filePath);
      const key = createHmac('sha256', state.secret).update(ip).digest('hex');
      if (state.responses[key]?.attendance !== attendance) {
        state.responses[key] = { attendance, updatedAt: new Date().toISOString() };
        const content = JSON.stringify(state, null, 2);
        atomicWrite(filePath, content);
        atomicWrite(backupPath, content);
      }
      return snapshot(state, ip);
    },
  };
}
