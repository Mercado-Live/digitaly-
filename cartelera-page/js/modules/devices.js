// ================================================================
// CARTELERA DIGITAL - modules/devices.js
// Gestion de dispositivos: lista, detalle, creacion, pairing
// ================================================================

import { renderAppShell } from './shell.js';
import { getUserDevices, createDevice, update, remove, fetchById, getUserPlaylists } from '../api.js';
import { t } from '../utils/i18n.js';
import { timeAgo, showModal, closeModal } from '../utils/dom.js';
import { formatDateTime } from '../utils/format.js';
import { sendDeviceCommand } from './realtime.js';
import { showToast } from './notifications.js';

let currentFilter = 'all';

export async function renderDevicesListPage(store, router) {
    const state = store.getState();
    const userId = state.user?.id;

    renderAppShell(store, router, `
        <div class="page-header">
            <div>
                <h2 class="page-title">${t('devices')}</h2>
                <p class="page-subtitle">Gestiona tus dispositivos conectados</p>
            </div>
            <div class="page-actions">
                <button class="btn btn--primary" id="btn-add-device">+ Agregar Dispositivo</button>
            </div>
        </div>
        <div class="toolbar">
            <div class="toolbar__left">
                <div class="search-input-wrapper">
                    <span class="search-input-wrapper__icon">&#x1F50D;</span>
                    <input class="form-input" type="text" id="device-search" placeholder="Buscar dispositivo...">
                </div>
                <div class="filter-bar">
                    <button class="filter-chip filter-chip--active" data-filter="all">Todos</button>
                    <button class="filter-chip" data-filter="online">En linea</button>
                    <button class="filter-chip" data-filter="offline">Sin conexion</button>
                    <button class="filter-chip" data-filter="idle">En espera</button>
                </div>
            </div>
        </div>
        <div id="devices-list">
            <div class="skeleton skeleton--card" style="height:80px;margin-bottom:12px"></div>
            <div class="skeleton skeleton--card" style="height:80px;margin-bottom:12px"></div>
        </div>
    `, t('devices'));

    document.getElementById('btn-add-device').addEventListener('click', () => showAddDeviceModal(store, router));

    // Filtros
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-chip--active'));
            chip.classList.add('filter-chip--active');
            currentFilter = chip.dataset.filter;
            loadAndRenderDevices(store, router, userId);
        });
    });

    // Busqueda
    const searchInput = document.getElementById('device-search');
    let searchTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadAndRenderDevices(store, router, userId), 300);
    });

    if (userId) loadAndRenderDevices(store, router, userId);
}

async function loadAndRenderDevices(store, router, userId) {
    if (!userId) return;
    const container = document.getElementById('devices-list');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

    try {
        const { data: devices } = await getUserDevices(userId);
        store.setState({ devices });

        const searchQuery = document.getElementById('device-search')?.value?.toLowerCase() || '';
        let filtered = devices || [];

        if (currentFilter !== 'all') {
            filtered = filtered.filter(d => d.status === currentFilter);
        }
        if (searchQuery) {
            filtered = filtered.filter(d =>
                (d.name || '').toLowerCase().includes(searchQuery) ||
                (d.location || '').toLowerCase().includes(searchQuery)
            );
        }

        const online = filtered.filter(d => d.status === 'online' || d.status === 'playing').length;
        store.setState({ devicesOnline: online, devicesOffline: filtered.length - online });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">&#x1F4FA;</div>
                    <div class="empty-state__title">${t('noDevices')}</div>
                    <div class="empty-state__description">Agrega tu primer dispositivo para empezar a mostrar contenido en tus pantallas.</div>
                    <button class="btn btn--primary" id="btn-add-first">+ Agregar Dispositivo</button>
                </div>`;
            document.getElementById('btn-add-first')?.addEventListener('click', () => showAddDeviceModal(store, router));
            return;
        }

        container.innerHTML = filtered.map(d => renderDeviceCard(d, router)).join('');

        // Bind de acciones
        container.querySelectorAll('[data-device-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.deviceAction;
                const deviceId = btn.dataset.deviceId;
                handleDeviceAction(action, deviceId, store, router);
            });
        });

        // Click en card
        container.querySelectorAll('.device-card').forEach(card => {
            card.addEventListener('click', () => {
                router.navigate('/devices/' + card.dataset.deviceId);
            });
        });

    } catch (err) {
        console.error('Error cargando dispositivos:', err);
        container.innerHTML = '<div class="empty-state"><div class="empty-state__title">Error al cargar</div></div>';
    }
}

function renderDeviceCard(device, router) {
    const statusClass = device.status === 'online' || device.status === 'playing' ? 'online' :
                       device.status === 'idle' ? 'idle' : 'offline';
    const statusText = device.status === 'online' ? 'En linea' :
                      device.status === 'playing' ? 'Reproduciendo' :
                      device.status === 'idle' ? 'En espera' : 'Sin conexion';

    return `
    <div class="card card--clickable device-card" data-device-id="${device.id}" style="margin-bottom:12px">
        <div class="device-card__main">
            <div class="device-card__info">
                <div class="device-card__name">
                    <span class="status-dot status-dot--${statusClass}"></span>
                    ${device.name || 'Sin nombre'}
                    <span class="badge badge--${statusClass === 'online' ? 'success' : statusClass === 'idle' ? 'warning' : 'error'}">${statusText}</span>
                </div>
                <div class="device-card__location">${device.location || 'Sin ubicacion'}</div>
                <div class="device-card__meta">
                    <span>${device.resolution || '—'}</span>
                    <span>v${device.software_version || '—'}</span>
                    <span>${device.status === 'offline' ? 'Ultimo: ' + timeAgo(device.last_seen) : timeAgo(device.last_seen)}</span>
                </div>
            </div>
        </div>
        <div class="device-card__actions">
            <button class="btn btn--ghost btn--sm" data-device-action="view" data-device-id="${device.id}">Ver detalle</button>
            <button class="btn btn--ghost btn--sm" data-device-action="assign" data-device-id="${device.id}">Asignar contenido</button>
            ${device.status === 'offline' ? `<button class="btn btn--ghost btn--sm btn--danger" data-device-action="delete" data-device-id="${device.id}">Eliminar</button>` : ''}
        </div>
    </div>`;
}

function handleDeviceAction(action, deviceId, store, router) {
    switch (action) {
        case 'view':
            router.navigate('/devices/' + deviceId);
            break;
        case 'assign':
            showAssignContentModal(deviceId, store);
            break;
        case 'sync':
            sendDeviceCommand(deviceId, 'sync');
            showToast('Sincronizacion enviada', 'info');
            break;
        case 'delete':
            if (confirm(t('confirmDelete'))) {
                remove('devices', deviceId).then(() => {
                    showToast('Dispositivo eliminado', 'success');
                    const devices = store.getState().devices.filter(d => d.id !== deviceId);
                    store.setState({ devices });
                    loadAndRenderDevices(store, window.__app?.router, store.getState().user?.id);
                }).catch(() => showToast('Error al eliminar', 'error'));
            }
            break;
    }
}

// --- Modal: Agregar dispositivo ---
function showAddDeviceModal(store, router) {
    const overlay = showModal(`
        <div class="modal">
            <div class="modal__header">
                <span class="modal__title">Agregar Dispositivo</span>
                <button class="modal__close">&times;</button>
            </div>
            <div class="modal__body">
                <form id="add-device-form">
                    <div class="form-group">
                        <label class="form-label form-label--required" for="dev-name">Nombre</label>
                        <input class="form-input" type="text" id="dev-name" placeholder="Ej: TV Entrada Principal" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="dev-location">Ubicacion</label>
                        <input class="form-input" type="text" id="dev-location" placeholder="Ej: Hall de entrada">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="dev-orientation">Orientacion</label>
                        <select class="form-select" id="dev-orientation">
                            <option value="landscape">Horizontal (Landscape)</option>
                            <option value="portrait">Vertical (Portrait)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="dev-resolution">Resolucion</label>
                        <select class="form-select" id="dev-resolution">
                            <option value="1920x1080">1920x1080 (Full HD)</option>
                            <option value="3840x2160">3840x2160 (4K UHD)</option>
                            <option value="1280x720">1280x720 (HD)</option>
                            <option value="1080x1920">1080x1920 (Vertical)</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal__footer">
                <button class="btn btn--secondary" onclick="document.querySelector('.modal-overlay--open').remove()">Cancelar</button>
                <button class="btn btn--primary" id="btn-save-device">Crear Dispositivo</button>
            </div>
        </div>
    `);

    const closeFn = () => closeModal(overlay);
    overlay.querySelector('.modal__close').addEventListener('click', closeFn);
    overlay.querySelector('#btn-save-device').addEventListener('click', async () => {
        const btn = overlay.querySelector('#btn-save-device');
        const name = overlay.querySelector('#dev-name').value.trim();
        if (!name) { showToast('El nombre es obligatorio', 'error'); return; }

        btn.disabled = true;
        btn.textContent = 'Creando...';

        try {
            const device = await createDevice({
                user_id: store.getState().user.id,
                name,
                location: overlay.querySelector('#dev-location').value.trim(),
                orientation: overlay.querySelector('#dev-orientation').value,
                resolution: overlay.querySelector('#dev-resolution').value
            });

            closeModal(overlay);
            showPairingCodeModal(device.device_key, device.name);

            const devices = [device, ...store.getState().devices];
            store.setState({ devices });
            loadAndRenderDevices(store, router, store.getState().user.id);
        } catch (err) {
            showToast('Error al crear dispositivo: ' + (err.message || 'Error'), 'error');
            btn.disabled = false;
            btn.textContent = 'Crear Dispositivo';
        }
    });
}

function showPairingCodeModal(code, deviceName) {
    const overlay = showModal(`
        <div class="modal">
            <div class="modal__header">
                <span class="modal__title">Dispositivo Creado</span>
                <button class="modal__close">&times;</button>
            </div>
            <div class="modal__body">
                <div class="pairing-code">
                    <p class="pairing-code__title">Codigo de Vinculacion para "${deviceName}"</p>
                    <div class="pairing-code__value">${code}</div>
                    <p class="pairing-code__hint">Ingresa este codigo en la app del televisor para vincularlo a tu cuenta.</p>
                    <div class="pairing-code__actions">
                        <button class="btn btn--secondary" id="btn-copy-code">Copiar Codigo</button>
                        <button class="btn btn--primary" id="btn-close-pairing">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `);

    overlay.querySelector('.modal__close').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#btn-close-pairing').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#btn-copy-code').addEventListener('click', () => {
        navigator.clipboard.writeText(code).then(() => {
            showToast('Codigo copiado al portapapeles', 'success');
        }).catch(() => showToast('No se pudo copiar', 'error'));
    });
}

// --- Pagina de detalle de dispositivo ---
export async function renderDeviceDetailPage(store, router, deviceId) {
    const state = store.getState();

    try {
        const device = await fetchById('devices', deviceId);
        store.setState({ selectedDevice: device });

        let playlistName = '';
        if (device.current_playlist_id) {
            try {
                const playlist = await fetchById('playlists', device.current_playlist_id, 'name');
                playlistName = playlist.name;
            } catch (e) { /* playlist no encontrada */ }
        }

        const statusClass = device.status === 'online' || device.status === 'playing' ? 'online' :
                           device.status === 'idle' ? 'idle' : 'offline';
        const statusText = device.status === 'online' ? 'En linea' :
                          device.status === 'playing' ? 'Reproduciendo' :
                          device.status === 'idle' ? 'En espera' : 'Sin conexion';

        renderAppShell(store, router, `
            <div class="device-detail__header">
                <div>
                    <button class="device-detail__back" onclick="window.location.hash='#/devices'">
                        \u2190 Volver a dispositivos
                    </button>
                    <h2 class="page-title">${device.name || 'Dispositivo'}</h2>
                    <p class="page-subtitle">${device.location || ''}</p>
                </div>
                <div class="device-detail__status">
                    <span class="status-dot status-dot--${statusClass}"></span>
                    <span class="badge badge--${statusClass === 'online' ? 'success' : statusClass === 'idle' ? 'warning' : 'error'}">${statusText}</span>
                </div>
            </div>
            <div class="device-detail">
                <div>
                    <div class="card" style="margin-bottom:24px">
                        <div class="card__title" style="margin-bottom:16px">Informacion</div>
                        <div class="info-list">
                            <div class="info-item"><span class="info-item__label">Nombre</span><span class="info-item__value">${device.name || '—'}</span></div>
                            <div class="info-item"><span class="info-item__label">Ubicacion</span><span class="info-item__value">${device.location || '—'}</span></div>
                            <div class="info-item"><span class="info-item__label">Resolucion</span><span class="info-item__value">${device.resolution || '—'}</span></div>
                            <div class="info-item"><span class="info-item__label">Orientacion</span><span class="info-item__value">${device.orientation === 'portrait' ? 'Vertical' : 'Horizontal'}</span></div>
                            <div class="info-item"><span class="info-item__label">Version</span><span class="info-item__value">${device.software_version || '—'}</span></div>
                            <div class="info-item"><span class="info-item__label">IP</span><span class="info-item__value">${device.ip_address || '—'}</span></div>
                            <div class="info-item"><span class="info-item__label">Ultima vez</span><span class="info-item__value">${formatDateTime(device.last_seen)}</span></div>
                            <div class="info-item"><span class="info-item__label">Codigo vinculacion</span><span class="info-item__value" style="font-family:monospace">${device.device_key || '—'}</span></div>
                            ${playlistName ? `<div class="info-item"><span class="info-item__label">Playlist asignada</span><span class="info-item__value" style="color:var(--color-primary)">${playlistName}</span></div>` : ''}
                        </div>
                    </div>
                    <div class="card" style="margin-bottom:24px">
                        <div class="card__title" style="margin-bottom:16px">Acciones</div>
                        <div class="action-grid">
                            <button class="action-btn" id="btn-assign-content">
                                <span class="action-btn__icon">\u{1F3AC}</span> Cambiar contenido
                            </button>
                            <button class="action-btn" id="btn-sync-device">
                                <span class="action-btn__icon">\u{1F504}</span> Forzar sincronizacion
                            </button>
                            <button class="action-btn" id="btn-restart-device">
                                <span class="action-btn__icon">\u{1F503}</span> Reiniciar dispositivo
                            </button>
                            <button class="action-btn" id="btn-settings-device">
                                <span class="action-btn__icon">\u2699</span> Configuracion
                            </button>
                            <button class="action-btn" id="btn-delete-device" style="color:var(--color-error)">
                                <span class="action-btn__icon">\u{1F5D1}</span> Eliminar dispositivo
                            </button>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card__title" style="margin-bottom:16px">Historial de actividad</div>
                        <div class="log-list" id="device-logs">
                            <div class="log-item">
                                <span class="log-item__time">${formatDateTime(device.created_at)}</span>
                                <span class="log-item__event">Dispositivo registrado</span>
                            </div>
                            ${device.last_seen ? `
                            <div class="log-item">
                                <span class="log-item__time">${formatDateTime(device.last_seen)}</span>
                                <span class="log-item__event">Ultima actividad: ${statusText}</span>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
                <div class="preview-panel">
                    <div class="card">
                        <div class="preview-panel__screen" id="device-preview">
                            <div class="preview-panel__placeholder">
                                ${device.current_media_id || device.current_playlist_id ?
                                    'Cargando preview...' :
                                    'Sin contenido asignado'}
                            </div>
                        </div>
                        <div class="preview-panel__label">Previsualizacion</div>
                    </div>
                </div>
            </div>
        `, device.name || 'Dispositivo');

        // Bind acciones
        document.getElementById('btn-assign-content')?.addEventListener('click', () => showAssignContentModal(deviceId, store));
        document.getElementById('btn-sync-device')?.addEventListener('click', () => {
            sendDeviceCommand(deviceId, 'sync');
            showToast('Comando de sincronizacion enviado', 'info');
        });
        document.getElementById('btn-restart-device')?.addEventListener('click', () => {
            if (confirm('Estas seguro de reiniciar este dispositivo?')) {
                sendDeviceCommand(deviceId, 'restart');
                showToast('Comando de reinicio enviado', 'info');
            }
        });
        document.getElementById('btn-delete-device')?.addEventListener('click', () => {
            if (confirm(t('confirmDelete'))) {
                remove('devices', deviceId).then(() => {
                    showToast('Dispositivo eliminado', 'success');
                    router.navigate('/devices');
                }).catch(() => showToast('Error al eliminar', 'error'));
            }
        });

        // Preview
        loadDevicePreview(device);

    } catch (err) {
        console.error('Error cargando dispositivo:', err);
        showToast('Error al cargar el dispositivo', 'error');
        router.navigate('/devices');
    }
}

async function loadDevicePreview(device) {
    const preview = document.getElementById('device-preview');
    if (!preview) return;

    if (device.current_media_id) {
        try {
            const media = await fetchById('media', device.current_media_id, 'id,type,url,name');
            if (media) {
                preview.innerHTML = media.type === 'video'
                    ? `<video src="${media.url}" autoplay muted loop style="width:100%;height:100%;object-fit:contain"></video>`
                    : `<img src="${media.url}" alt="${media.name}" style="width:100%;height:100%;object-fit:contain">`;
                return;
            }
        } catch (e) {
            preview.innerHTML = '<div class="preview-panel__placeholder">Error al cargar preview</div>';
            return;
        }
    }

    if (device.current_playlist_id) {
        try {
            const playlist = await fetchById('playlists', device.current_playlist_id, 'id,name,items');
            const items = playlist.items || [];
            for (const slide of items) {
                const zones = slide.zones || [];
                for (const zone of zones) {
                    if (zone.media_id) {
                        const media = await fetchById('media', zone.media_id, 'id,type,url,name');
                        if (media) {
                            preview.innerHTML = media.type === 'video'
                                ? `<video src="${media.url}" autoplay muted loop style="width:100%;height:100%;object-fit:contain"></video>`
                                : `<img src="${media.url}" alt="${media.name}" style="width:100%;height:100%;object-fit:contain">`;
                            return;
                        }
                    }
                }
            }
            preview.innerHTML = '<div class="preview-panel__placeholder">Playlist sin contenido multimedia</div>';
        } catch (e) {
            preview.innerHTML = '<div class="preview-panel__placeholder">Error al cargar preview</div>';
        }
    }
}

// --- Modal: Asignar contenido ---
async function showAssignContentModal(deviceId, store) {
    const userId = store.getState().user?.id;
    let playlists = [];

    try {
        const res = await getUserPlaylists(userId);
        playlists = res.data || [];
    } catch (e) { /* */ }

    const overlay = showModal(`
        <div class="modal modal--lg">
            <div class="modal__header">
                <span class="modal__title">Asignar Contenido al Dispositivo</span>
                <button class="modal__close">&times;</button>
            </div>
            <div class="modal__body">
                <div class="tabs" style="margin-bottom:20px">
                    <button class="tab tab--active" data-tab="playlist">Playlist</button>
                </div>
                <div id="assign-playlist-tab">
                    ${playlists.length === 0 ? `
                        <div class="empty-state" style="padding:40px">
                            <div class="empty-state__icon">\u{1F3B5}</div>
                            <div class="empty-state__title">No tienes playlists</div>
                            <div class="empty-state__description">Crea una playlist primero para asignarla a este dispositivo.</div>
                            <button class="btn btn--primary" onclick="window.location.hash='#/playlists'">Crear Playlist</button>
                        </div>
                    ` : `
                        <div class="form-group">
                            <label class="form-label">Seleccionar Playlist</label>
                            <select class="form-select" id="playlist-select">
                                <option value="">-- Seleccionar --</option>
                                ${playlists.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                            </select>
                        </div>
                    `}
                </div>
            </div>
            <div class="modal__footer">
                <button class="btn btn--secondary" onclick="document.querySelector('.modal-overlay--open').remove()">Cancelar</button>
                ${playlists.length > 0 ? '<button class="btn btn--primary" id="btn-confirm-assign">Asignar</button>' : ''}
            </div>
        </div>
    `);

    overlay.querySelector('.modal__close').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#btn-confirm-assign')?.addEventListener('click', async () => {
        const playlistId = overlay.querySelector('#playlist-select').value;
        if (!playlistId) { showToast('Selecciona una playlist', 'warning'); return; }

        try {
            await update('devices', deviceId, { current_playlist_id: playlistId });
            showToast('Playlist asignada correctamente', 'success');
            closeModal(overlay);
        } catch (err) {
            showToast('Error al asignar: ' + (err.message || 'Error'), 'error');
        }
    });
}
