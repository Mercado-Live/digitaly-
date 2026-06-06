// ================================================================
// CARTELERA DIGITAL - modules/dashboard.js
// Dashboard principal: metricas, actividad, dispositivos
// ================================================================

import { renderAppShell } from './shell.js';
import { getUserDevices, getUserMedia, getUserPlaylists } from '../api.js';
import { t } from '../utils/i18n.js';
import { formatBytes, timeAgo } from '../utils/dom.js';
import { formatDateTime } from '../utils/format.js';
import { showToast } from './notifications.js';

export async function renderDashboardPage(store, router) {
    const state = store.getState();
    const userId = state.user?.id;

    // Mostrar shell con skeleton loading
    renderAppShell(store, router, `
        <div class="page-header">
            <div>
                <h2 class="page-title">${t('dashboard')}</h2>
                <p class="page-subtitle">Bienvenido, ${state.user?.profile?.full_name || state.user?.email || 'Usuario'}</p>
            </div>
            <div class="page-actions">
                <span class="badge badge--neutral" id="dashboard-time"></span>
            </div>
        </div>
        <div id="dashboard-content">
            <div class="skeleton skeleton--card" style="height:120px;margin-bottom:24px"></div>
            <div class="skeleton skeleton--card" style="height:300px"></div>
        </div>
    `, t('dashboard'));

    // Reloj
    function updateTime() {
        const el = document.getElementById('dashboard-time');
        if (el) el.textContent = new Date().toLocaleString('es-ES');
    }
    updateTime();
    setInterval(updateTime, 10000);

    // Cargar datos
    if (!userId) return;

    try {
        const [devicesRes, mediaRes, playlistsRes] = await Promise.all([
            getUserDevices(userId),
            getUserMedia(userId, { limit: 1, select: 'id' }),
            getUserPlaylists(userId)
        ]);

        const devices = devicesRes.data || [];
        const totalMedia = mediaRes.count || 0;
        const playlists = playlistsRes.data || [];
        const online = devices.filter(d => d.status === 'online' || d.status === 'playing').length;

        store.setState({
            devices,
            mediaItems: [], // Se cargan en la pagina de media
            playlists,
            devicesOnline: online,
            devicesOffline: devices.length - online,
            dashboardStats: {
                totalDevices: devices.length,
                activeDevices: online,
                totalMedia,
                totalPlaylists: playlists.length,
                storageUsed: 0,
                storageLimit: 0
            }
        });

        renderDashboardContent(store, router, devices, totalMedia, playlists.length);

    } catch (err) {
        console.error('Error al cargar dashboard:', err);
        showToast('Error al cargar los datos del panel', 'error');
    }
}

function renderDashboardContent(store, router, devices, totalMedia, totalPlaylists) {
    const container = document.getElementById('dashboard-content');
    if (!container) return;

    const online = devices.filter(d => d.status === 'online' || d.status === 'playing').length;

    // Determinar si es primer inicio
    const isFirstTime = devices.length === 0 && totalMedia === 0;

    if (isFirstTime) {
        container.innerHTML = renderWelcome();
        bindWelcomeActions(router);
    } else {
        container.innerHTML = `
            ${renderStats(online, devices.length, totalMedia, totalPlaylists)}
            ${renderDevicesPreview(devices, router)}
            ${renderQuickActions(router)}
        `;
    }
}

function renderStats(online, total, mediaCount, playlistCount) {
    return `
    <div class="dashboard-stats">
        <div class="card stat-card">
            <div class="stat-card__value">${online}</div>
            <div class="stat-card__label">Dispositivos en linea</div>
        </div>
        <div class="card stat-card">
            <div class="stat-card__value">${total}</div>
            <div class="stat-card__label">Dispositivos totales</div>
        </div>
        <div class="card stat-card">
            <div class="stat-card__value">${mediaCount}</div>
            <div class="stat-card__label">Archivos multimedia</div>
        </div>
        <div class="card stat-card">
            <div class="stat-card__value">${playlistCount}</div>
            <div class="stat-card__label">Playlists</div>
        </div>
    </div>`;
}

function renderWelcome() {
    return `
    <div class="welcome-card">
        <h3 class="welcome-card__title">Bienvenido a Cartelera Digital</h3>
        <p class="welcome-card__text">Comienza configurando tu primer dispositivo para mostrar contenido en tus pantallas.</p>
        <div class="welcome-steps">
            <div class="welcome-step">
                <div class="welcome-step__number">1</div>
                <div class="welcome-step__title">Agrega un dispositivo</div>
                <div class="welcome-step__desc">Crea un dispositivo y obten un codigo de vinculacion para tu TV.</div>
                <button class="btn btn--sm" data-action="add-device">Empezar</button>
            </div>
            <div class="welcome-step">
                <div class="welcome-step__number">2</div>
                <div class="welcome-step__title">Sube contenido</div>
                <div class="welcome-step__desc">Imagenes y videos para mostrar en tus pantallas.</div>
                <button class="btn btn--sm" data-action="upload-media">Subir archivos</button>
            </div>
            <div class="welcome-step">
                <div class="welcome-step__number">3</div>
                <div class="welcome-step__title">Crea una playlist</div>
                <div class="welcome-step__desc">Organiza tu contenido y asignalo a tus pantallas.</div>
                <button class="btn btn--sm" data-action="create-playlist">Crear playlist</button>
            </div>
        </div>
    </div>`;
}

function bindWelcomeActions(router) {
    const actions = {
        'add-device': () => router.navigate('/devices'),
        'upload-media': () => router.navigate('/media'),
        'create-playlist': () => router.navigate('/playlists')
    };
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = actions[btn.dataset.action];
            if (action) action();
        });
    });
}

function renderDevicesPreview(devices, router) {
    if (!devices.length) return '';

    const previewDevices = devices.slice(0, 6);
    const cards = previewDevices.map(d => {
        const statusClass = d.status === 'online' || d.status === 'playing' ? 'online' :
                           d.status === 'idle' ? 'idle' : 'offline';
        const statusText = d.status === 'online' || d.status === 'playing' ? 'En linea' :
                          d.status === 'idle' ? 'En espera' : 'Sin conexion';
        return `
        <div class="card card--clickable device-preview-card" data-device-id="${d.id}">
            <div class="device-preview-card__header">
                <span class="device-preview-card__name">${d.name || 'Sin nombre'}</span>
                <span class="badge badge--${statusClass === 'online' ? 'success' : statusClass === 'idle' ? 'warning' : 'error'}">${statusText}</span>
            </div>
            <div class="device-preview-card__content">${d.location || 'Sin ubicacion'}</div>
            <div class="device-preview-card__meta">
                <span>${d.resolution || '—'}</span>
                <span>${d.status === 'offline' ? 'Ultima vez: ' + timeAgo(d.last_seen) : timeAgo(d.last_seen)}</span>
            </div>
        </div>`;
    }).join('');

    // Bind de clicks en cards (hecho en el DOM cargado)
    setTimeout(() => {
        document.querySelectorAll('.device-preview-card').forEach(card => {
            card.addEventListener('click', () => {
                router.navigate('/devices/' + card.dataset.deviceId);
            });
        });
    }, 0);

    return `
    <div class="card" style="margin-bottom:24px">
        <div class="card__header">
            <span class="card__title">Dispositivos</span>
            <button class="btn btn--ghost btn--sm" data-nav="devices">Ver todos</button>
        </div>
        <div class="device-preview-grid">${cards}</div>
    </div>`;
}

function renderQuickActions(router) {
    return `
    <div class="quick-actions">
        <button class="btn btn--primary" onclick="window.location.hash='#/devices'">+ Agregar Dispositivo</button>
        <button class="btn btn--secondary" onclick="window.location.hash='#/media'">+ Subir Contenido</button>
        <button class="btn btn--secondary" onclick="window.location.hash='#/playlists'">+ Nueva Playlist</button>
    </div>`;
}
