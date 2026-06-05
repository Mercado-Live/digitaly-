// ================================================================
// CARTELERA DIGITAL - state.js
// Store de estado centralizado (patron pub/sub observador)
// ================================================================

export class Store {
    constructor(initialState = {}) {
        this._state = { ...initialState };
        this._listeners = new Map();
        this._globalListeners = new Set();
    }

    getState() {
        return this._state;
    }

    setState(partial) {
        const prevState = { ...this._state };
        this._state = { ...this._state, ...partial };

        // Notificar listeners globales
        for (const cb of this._globalListeners) {
            try { cb(this._state, prevState); } catch (e) { console.error('Store listener error:', e); }
        }

        // Notificar listeners por clave
        for (const [key, value] of Object.entries(partial)) {
            if (this._listeners.has(key)) {
                for (const cb of this._listeners.get(key)) {
                    try { cb(value, prevState[key]); } catch (e) { console.error('Store listener error:', e); }
                }
            }
        }
    }

    subscribe(keyOrCallback, callback) {
        if (typeof keyOrCallback === 'function') {
            this._globalListeners.add(keyOrCallback);
            return () => this._globalListeners.delete(keyOrCallback);
        }
        if (!this._listeners.has(keyOrCallback)) {
            this._listeners.set(keyOrCallback, new Set());
        }
        this._listeners.get(keyOrCallback).add(callback);
        return () => this._listeners.get(keyOrCallback)?.delete(callback);
    }

    reset(initialState = {}) {
        this._state = { ...initialState };
    }
}

// Estado inicial de la aplicacion
export const INITIAL_STATE = {
    // Autenticacion
    user: null,
    session: null,
    isAuthenticated: false,
    isAuthLoading: true,

    // Dispositivos
    devices: [],
    selectedDevice: null,
    devicesOnline: 0,
    devicesOffline: 0,

    // Media
    mediaItems: [],
    mediaFilter: 'all',
    mediaSearchQuery: '',
    mediaViewMode: 'grid',

    // Playlists
    playlists: [],
    currentPlaylist: null,

    // Schedules
    schedules: [],
    currentSchedule: null,

    // UI
    theme: localStorage.getItem('theme') || 'light',
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
    activeModal: null,
    toasts: [],
    isOnline: navigator.onLine,

    // Dashboard
    dashboardStats: {
        totalDevices: 0,
        activeDevices: 0,
        totalMedia: 0,
        totalPlaylists: 0,
        storageUsed: 0,
        storageLimit: 0
    }
};
