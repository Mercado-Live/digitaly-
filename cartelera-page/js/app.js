// ================================================================
// CARTELERA DIGITAL - app.js
// Entry point de la SPA: inicializa Supabase, Store, Router y modulos
// ================================================================

import { Store, INITIAL_STATE } from './state.js';
import { Router } from './router.js';
import { initSupabase } from './supabase.js';
import { getSession, onAuthStateChange, signOut, getProfile } from './auth.js';
import { showToast } from './modules/notifications.js';
import { initRealtime, cleanupChannels } from './modules/realtime.js';
import { renderAppShell, updateSidebarActive } from './modules/shell.js';

// Paginas
import { renderLoginPage } from './pages/login.js';
import { renderRegisterPage } from './pages/register.js';
import { renderDashboardPage } from './modules/dashboard.js';
import { renderDevicesListPage, renderDeviceDetailPage } from './modules/devices.js';
import { renderMediaPage } from './modules/media.js';
import { renderPlaylistsListPage, renderPlaylistEditorPage } from './modules/playlists.js';
import { renderSchedulesListPage, renderScheduleEditorPage } from './modules/schedules.js';
import { renderSettingsPage } from './pages/settings.js';

// --- Bootstrap ---

// Safety net: atrapar errores no manejados para evitar pantalla blanca
window.addEventListener('unhandledrejection', (event) => {
    console.error('Error no manejado:', event.reason);
    const loadingEl = document.getElementById('app-loading');
    if (loadingEl) loadingEl.remove();
});
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
    const loadingEl = document.getElementById('app-loading');
    if (loadingEl) loadingEl.remove();
});

async function bootstrap() {
    // Inicializar Supabase
    const supabase = initSupabase();

    // Store global
    const store = new Store(INITIAL_STATE);
    window.__STORE__ = store;

    // Aplicar tema guardado
    applyTheme(store.getState().theme);

    // Router
    const router = new Router(store, supabase);

    // Guard de autenticacion
    router.addGuard(async (options) => {
        if (options.public) return true;
        const session = await getSession();
        if (session) {
            store.setState({ user: session.user, session, isAuthenticated: true, isAuthLoading: false });
            return true;
        }
        store.setState({ isAuthenticated: false, isAuthLoading: false });
        return false;
    });

    // Registrar rutas
    router
        .register('/login', () => renderLoginPage(store, router), { public: true })
        .register('/register', () => renderRegisterPage(store, router), { public: true })
        .register('/dashboard', () => renderDashboardPage(store, router))
        .register('/devices', () => renderDevicesListPage(store, router))
        .register('/devices/:id', (p) => renderDeviceDetailPage(store, router, p.id))
        .register('/media', () => renderMediaPage(store, router))
        .register('/playlists', () => renderPlaylistsListPage(store, router))
        .register('/playlists/:id', (p) => renderPlaylistEditorPage(store, router, p.id))
        .register('/schedules', () => renderSchedulesListPage(store, router))
        .register('/schedules/:id', (p) => renderScheduleEditorPage(store, router, p.id))
        .register('/settings', () => renderSettingsPage(store, router));

    // Listener de cambios de auth (login/logout externo, refresh de token)
    onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            const profile = await getProfile(session.user.id);
            store.setState({
                user: { ...session.user, profile },
                session,
                isAuthenticated: true,
                isAuthLoading: false
            });
            try { initRealtime(store); } catch(e) { console.warn('Realtime init fallo:', e); }
            const currentHash = window.location.hash.slice(1);
            if (!currentHash || currentHash === '/login' || currentHash === '/register') {
                router.replace('/dashboard');
            }
        } else if (event === 'SIGNED_OUT') {
            cleanupChannels();
            store.reset(INITIAL_STATE);
            store.setState({ isAuthenticated: false, isAuthLoading: false });
            router.replace('/login');
        } else if (event === 'TOKEN_REFRESHED' && session) {
            store.setState({ session });
        }
    });

    // Verificar sesion existente al cargar
    try {
        const session = await getSession();
        if (session) {
            const profile = await getProfile(session.user.id);
            store.setState({
                user: { ...session.user, profile },
                session,
                isAuthenticated: true,
                isAuthLoading: false
            });
            try { initRealtime(store); } catch(e) { console.warn('Realtime init fallo:', e); }        } else {
            store.setState({ isAuthenticated: false, isAuthLoading: false });
        }
    } catch (err) {
        console.error('Error verificando sesion:', err);
        store.setState({ isAuthenticated: false, isAuthLoading: false });
    }

    // Escuchar eventos de navegacion para actualizar sidebar activo
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1) || '/login';
        updateSidebarActive(hash);
    });

    // Escuchar conectividad
    window.addEventListener('online', () => store.setState({ isOnline: true }));
    window.addEventListener('offline', () => {
        store.setState({ isOnline: false });
        showToast('Sin conexion a internet. Algunas funciones no estaran disponibles.', 'warning', 6000);
    });

    // Safety net: siempre quitar pantalla de carga en max 10s
    setTimeout(() => {
        const el = document.getElementById('app-loading');
        if (el) el.remove();
    }, 10000);

    // Quitar pantalla de carga
    const loadingEl = document.getElementById('app-loading');
    if (loadingEl) loadingEl.remove();

    // Exponer funciones globales para uso en onclick HTML
    window.__app = { store, router, signOut, showToast };
}

// --- Tema ---

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

export function toggleTheme(store) {
    const current = store.getState().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    store.setState({ theme: next });
    applyTheme(next);
}

// --- Iniciar ---

bootstrap().catch(err => {
    console.error('Error al iniciar la aplicacion:', err);
    const root = document.getElementById('app-root');
    if (root) {
        root.innerHTML = `
            <div class="empty-state" style="min-height:100vh">
                <div class="empty-state__icon">!</div>
                <div class="empty-state__title">Error al iniciar</div>
                <div class="empty-state__description">
                    No se pudo conectar con Supabase. Verifica que las credenciales en js/supabase.js sean correctas.
                </div>
                <button class="btn btn--primary" onclick="location.reload()">Reintentar</button>
            </div>`;
    }
});
