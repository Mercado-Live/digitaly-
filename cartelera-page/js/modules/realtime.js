// ================================================================
// CARTELERA DIGITAL - modules/realtime.js
// Manejo de suscripciones Supabase Realtime
// ================================================================

import { ensureSupabase } from '../supabase.js';
import { showToast } from './notifications.js';

let channels = [];

export function initRealtime(store) {
    const supabase = ensureSupabase();
    if (!supabase) return;

    cleanupChannels();
    const userId = store.getState().user?.id;
    if (!userId) return;

    // Canal: cambios en devices del usuario
    try {
        const deviceChannel = supabase
            .channel(`user:${userId}:devices`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'devices', filter: `user_id=eq.${userId}` },
                (payload) => {
                    handleDeviceChange(store, payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log('[Realtime] Suscrito a cambios de devices');
            });
        channels.push(deviceChannel);
    } catch (e) {
        console.warn('[Realtime] Error suscribiendo a devices:', e.message);
    }

    // Canal: cambios en media del usuario
    try {
        const mediaChannel = supabase
            .channel(`user:${userId}:media`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'media', filter: `user_id=eq.${userId}` },
                (payload) => {
                    const media = store.getState().mediaItems;
                    store.setState({ mediaItems: [payload.new, ...media] });
                }
            )
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'media', filter: `user_id=eq.${userId}` },
                (payload) => {
                    const media = store.getState().mediaItems;
                    store.setState({ mediaItems: media.filter(m => m.id !== payload.old.id) });
                }
            )
            .subscribe();
        channels.push(mediaChannel);
    } catch (e) {
        console.warn('[Realtime] Error suscribiendo a media:', e.message);
    }

    // Canal: cambios en playlists
    try {
        const playlistChannel = supabase
            .channel(`user:${userId}:playlists`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'playlists', filter: `user_id=eq.${userId}` },
                (payload) => {
                    handlePlaylistChange(store, payload);
                }
            )
            .subscribe();
        channels.push(playlistChannel);
    } catch (e) {
        console.warn('[Realtime] Error suscribiendo a playlists:', e.message);
    }
}

function handleDeviceChange(store, payload) {
    const devices = store.getState().devices;
    let updated;

    switch (payload.eventType) {
        case 'INSERT':
            updated = [payload.new, ...devices];
            break;
        case 'UPDATE': {
            const idx = devices.findIndex(d => d.id === payload.new.id);
            if (idx >= 0) {
                updated = [...devices];
                updated[idx] = payload.new;
            } else {
                updated = devices;
            }
            break;
        }
        case 'DELETE':
            updated = devices.filter(d => d.id !== payload.old.id);
            break;
        default:
            updated = devices;
    }

    const online = updated.filter(d => d.status === 'online' || d.status === 'playing').length;
    const offline = updated.filter(d => d.status === 'offline').length;

    store.setState({
        devices: updated,
        devicesOnline: online,
        devicesOffline: offline,
        dashboardStats: {
            ...store.getState().dashboardStats,
            totalDevices: updated.length,
            activeDevices: online
        }
    });
}

function handlePlaylistChange(store, payload) {
    const playlists = store.getState().playlists;

    switch (payload.eventType) {
        case 'INSERT':
            store.setState({ playlists: [payload.new, ...playlists] });
            break;
        case 'UPDATE': {
            const idx = playlists.findIndex(p => p.id === payload.new.id);
            if (idx >= 0) {
                const updated = [...playlists];
                updated[idx] = payload.new;
                store.setState({ playlists: updated });
            }
            break;
        }
        case 'DELETE':
            store.setState({ playlists: playlists.filter(p => p.id !== payload.old.id) });
            break;
    }
}

// Suscribirse al canal de un dispositivo especifico para comandos y status
export function subscribeToDevice(deviceId, onEvent) {
    const supabase = ensureSupabase();
    if (!supabase) return () => {};

    const channel = supabase
        .channel(`device:${deviceId}:status`)
        .on('broadcast', { event: 'heartbeat' }, (payload) => {
            onEvent({ type: 'heartbeat', data: payload.payload });
        })
        .on('broadcast', { event: 'status_change' }, (payload) => {
            onEvent({ type: 'status_change', data: payload.payload });
        })
        .subscribe();

    channels.push(channel);

    return () => {
        supabase.removeChannel(channel);
        channels = channels.filter(c => c !== channel);
    };
}

// Enviar comando a un dispositivo
export async function sendDeviceCommand(deviceId, command, params = {}) {
    const supabase = ensureSupabase();
    if (!supabase) return;

    await supabase.channel(`device:${deviceId}:control`).send({
        type: 'broadcast',
        event: 'command',
        payload: { command, ...params, timestamp: new Date().toISOString() }
    });
}

// Limpiar todas las suscripciones
export function cleanupChannels() {
    const supabase = ensureSupabase();
    if (supabase) {
        channels.forEach(ch => {
            try { supabase.removeChannel(ch); } catch (e) { /* ignore */ }
        });
    }
    channels = [];
}
