import { useCallback, useEffect, useRef, useState } from 'react';
import { getBrowserId } from '../utils/browser-id.js';

class RsvpApiError extends Error {}

async function requestSnapshot(signal, attendance) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(cancel, 20000);
  try {
    let browserId;
    try {
      browserId = getBrowserId();
    } catch (error) {
      throw new RsvpApiError(error.message);
    }
    const response = await fetch('/api/rsvp', {
      method: attendance ? 'POST' : 'GET',
      headers: {
        'X-Rsvp-Browser-Id': browserId,
        ...(attendance ? { 'Content-Type': 'application/json' } : {}),
      },
      body: attendance ? JSON.stringify({ attendance }) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    });
    const snapshot = await response.json().catch(() => null);
    if (!response.ok) {
      throw new RsvpApiError(
        typeof snapshot?.error === 'string'
          ? snapshot.error
          : response.status === 404
            ? 'Layanan konfirmasi belum ditemukan. Silakan hubungi pengundang.'
            : response.status === 401 || response.status === 403
              ? 'Akses konfirmasi ditolak. Buka kembali tautan undangan dari pengundang.'
              : 'Konfirmasi kehadiran belum tersedia. Silakan coba lagi nanti.',
      );
    }
    if (
      !Number.isSafeInteger(snapshot?.counts?.attending) ||
      snapshot.counts.attending < 0 ||
      !Number.isSafeInteger(snapshot.counts?.declined) ||
      snapshot.counts.declined < 0 ||
      ![null, 'attending', 'declined'].includes(snapshot.attendance)
    )
      throw new Error('Data kehadiran belum dapat dimuat.');
    return snapshot;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
  }
}

export default function useRsvp() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const controllerRef = useRef(null);
  const latestRequestRef = useRef(0);
  const savingRef = useRef(false);

  const refresh = useCallback(async () => {
    const controller = controllerRef.current;
    if (!controller || controller.signal.aborted || savingRef.current) return;
    const requestId = ++latestRequestRef.current;
    try {
      const snapshot = await requestSnapshot(controller.signal);
      if (!controller.signal.aborted && requestId === latestRequestRef.current) {
        setData(snapshot);
        setError('');
      }
    } catch (error) {
      if (!controller.signal.aborted && requestId === latestRequestRef.current) {
        setError(
          error instanceof RsvpApiError
            ? error.message
            : 'Data kehadiran belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        );
      }
    } finally {
      if (!controller.signal.aborted && requestId === latestRequestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    refresh();
    const refreshVisiblePage = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const timer = setInterval(refreshVisiblePage, 30000);
    document.addEventListener('visibilitychange', refreshVisiblePage);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshVisiblePage);
    };
  }, [refresh]);

  const respond = useCallback(async (attendance) => {
    const controller = controllerRef.current;
    if (!controller || controller.signal.aborted || savingRef.current) return;
    savingRef.current = true;
    latestRequestRef.current += 1;
    setSaving(true);
    setError('');
    try {
      const snapshot = await requestSnapshot(controller.signal, attendance);
      if (!controller.signal.aborted) setData(snapshot);
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(
          error instanceof RsvpApiError
            ? error.message
            : 'Konfirmasi belum dapat dipastikan. Periksa koneksi lalu muat ulang.',
        );
      }
    } finally {
      savingRef.current = false;
      if (!controller.signal.aborted) setSaving(false);
    }
  }, []);

  return { data, loading, saving, error, refresh, respond };
}
