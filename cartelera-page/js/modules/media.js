// ================================================================
// CARTELERA DIGITAL - modules/media.js
// Biblioteca multimedia: galeria, subida, filtrado
// ================================================================

import { renderAppShell } from './shell.js';
import { getUserMedia, createMedia, remove, uploadFile, getPublicUrl } from '../api.js';
import { t } from '../utils/i18n.js';
import { formatBytes, formatDuration, showModal, closeModal, debounce } from '../utils/dom.js';
import { showToast } from './notifications.js';

const PAGE_SIZE = 20;
let currentPage = 1;
let currentType = 'all';
let searchQuery = '';

export async function renderMediaPage(store, router) {
    const state = store.getState();
    const userId = state.user?.id;

    renderAppShell(store, router, `
        <div class="page-header">
            <div>
                <h2 class="page-title">${t('media')}</h2>
                <p class="page-subtitle">Gestiona tus archivos multimedia</p>
            </div>
            <div class="page-actions">
                <button class="btn btn--primary" id="btn-upload">+ Subir Archivos</button>
            </div>
        </div>
        <div class="toolbar">
            <div class="toolbar__left">
                <div class="search-input-wrapper">
                    <span class="search-input-wrapper__icon">&#x1F50D;</span>
                    <input class="form-input" type="text" id="media-search" placeholder="Buscar archivos...">
                </div>
                <div class="filter-bar">
                    <button class="filter-chip filter-chip--active" data-filter="all">Todos</button>
                    <button class="filter-chip" data-filter="image">Imagenes</button>
                    <button class="filter-chip" data-filter="video">Videos</button>
                </div>
            </div>
            <div class="toolbar__right">
                <div class="view-toggle">
                    <button class="view-toggle__btn view-toggle__btn--active" data-view="grid">\u25A6</button>
                    <button class="view-toggle__btn" data-view="list">\u2630</button>
                </div>
            </div>
        </div>
        <div id="media-content">
            <div class="skeleton skeleton--card" style="height:200px"></div>
        </div>
        <div id="media-pagination"></div>
    `, t('media'));

    // Eventos
    document.getElementById('btn-upload').addEventListener('click', () => showUploadModal(store, userId));
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-chip--active'));
            chip.classList.add('filter-chip--active');
            currentType = chip.dataset.filter;
            currentPage = 1;
            loadMedia(store, userId);
        });
    });

    const searchInput = document.getElementById('media-search');
    searchInput.addEventListener('input', debounce(() => {
        searchQuery = searchInput.value.toLowerCase();
        currentPage = 1;
        loadMedia(store, userId);
    }, 300));

    let viewMode = 'grid';
    document.querySelectorAll('.view-toggle__btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-toggle__btn').forEach(b => b.classList.remove('view-toggle__btn--active'));
            btn.classList.add('view-toggle__btn--active');
            viewMode = btn.dataset.view;
            store.setState({ mediaViewMode: viewMode });
            renderMediaItems(store.getState().mediaItems, store, router);
        });
    });

    if (userId) loadMedia(store, userId);
}

async function loadMedia(store, userId) {
    const container = document.getElementById('media-content');
    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

    try {
        const filters = [['user_id', 'eq', userId], ['is_archived', 'eq', false]];
        if (currentType !== 'all') filters.push(['type', 'eq', currentType]);
        if (searchQuery) filters.push(['name', 'ilike', `%${searchQuery}%`]);

        const { data, count } = await getUserMedia(userId, {
            filters: filters.length > 2 ? filters : filters.slice(0, 1),
            limit: PAGE_SIZE,
            offset: (currentPage - 1) * PAGE_SIZE,
            select: '*'
        });

        store.setState({ mediaItems: data || [] });
        renderMediaItems(data || [], store, null);
        renderPagination(count || 0, store, userId);

    } catch (err) {
        console.error('Error cargando media:', err);
        container.innerHTML = '<div class="empty-state"><div class="empty-state__title">Error al cargar</div></div>';
    }
}

function renderMediaItems(items, store, router) {
    const container = document.getElementById('media-content');
    const viewMode = store.getState().mediaViewMode || 'grid';
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">\u{1F5BC}</div>
                <div class="empty-state__title">${t('noMedia')}</div>
                <div class="empty-state__description">Sube imagenes y videos para mostrar en tus pantallas.</div>
                <button class="btn btn--primary" onclick="document.getElementById('btn-upload').click()">Subir Archivos</button>
            </div>`;
        return;
    }

    if (viewMode === 'list') {
        container.innerHTML = items.map(m => `
            <div class="media-list-item" data-media-id="${m.id}">
                <div class="media-list-item__thumb">
                    ${m.type === 'video' ? '<div style="background:#000;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem">\u25B6</div>' :
                                          `<img src="${m.thumbnail_url || m.url}" alt="${m.name}" loading="lazy">`}
                </div>
                <div class="media-list-item__info">
                    <div class="media-list-item__name">${m.name}</div>
                    <div class="media-list-item__meta">${m.type} \u00B7 ${formatBytes(m.file_size || 0)} ${m.duration ? '\u00B7 ' + formatDuration(m.duration) : ''}</div>
                </div>
                <div class="media-list-item__actions">
                    <button class="btn btn--ghost btn--sm" data-media-action="preview" data-media-id="${m.id}">Ver</button>
                    <button class="btn btn--ghost btn--sm" data-media-action="delete" data-media-id="${m.id}">Eliminar</button>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = `<div class="media-grid">${items.map(m => renderMediaCard(m)).join('')}</div>`;
    }

    // Bind acciones
    container.querySelectorAll('[data-media-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.mediaAction;
            const id = btn.dataset.mediaId;
            const media = items.find(m => m.id === id);
            if (!media) return;
            handleMediaAction(action, media, store, router);
        });
    });

    container.querySelectorAll('.media-card').forEach(card => {
        card.addEventListener('click', () => {
            const media = items.find(m => m.id === card.dataset.mediaId);
            if (media) showMediaViewer(media);
        });
    });
}

function renderMediaCard(media) {
    const typeLabel = media.type === 'video' ? 'VID' : 'IMG';
    return `
    <div class="media-card" data-media-id="${media.id}">
        <div class="media-card__thumbnail">
            ${media.type === 'video'
                ? `<div style="background:#000;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:2rem">\u25B6</div>`
                : `<img src="${media.thumbnail_url || media.url}" alt="${media.name}" loading="lazy">`}
            <span class="media-card__type-badge">${typeLabel}</span>
        </div>
        <div class="media-card__info">
            <div class="media-card__name">${media.name}</div>
            <div class="media-card__meta">
                <span>${formatBytes(media.file_size || 0)}</span>
                ${media.duration ? `<span>\u00B7 ${formatDuration(media.duration)}</span>` : ''}
            </div>
        </div>
    </div>`;
}

function renderPagination(totalCount, store, userId) {
    const container = document.getElementById('media-pagination');
    if (!container) return;

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = '<div class="pagination">';
    html += `<button class="pagination__btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">\u25C0</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="pagination__btn ${i === currentPage ? 'pagination__btn--active' : ''}" data-page="${i}">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += '<span class="pagination__info">...</span>';
        }
    }

    html += `<button class="pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">\u25B6</button>`;
    html += `<span class="pagination__info">${totalCount} archivos</span>`;
    html += '</div>';

    container.innerHTML = html;

    container.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            loadMedia(store, userId);
        });
    });
}

function handleMediaAction(action, media, store, router) {
    switch (action) {
        case 'preview':
            showMediaViewer(media);
            break;
        case 'delete':
            if (confirm(t('confirmDelete'))) {
                remove('media', media.id).then(() => {
                    showToast('Archivo eliminado', 'success');
                    const items = store.getState().mediaItems.filter(m => m.id !== media.id);
                    store.setState({ mediaItems: items });
                    renderMediaItems(items, store, router);
                }).catch(() => showToast('Error al eliminar', 'error'));
            }
            break;
    }
}

// --- Modal: Visor de media ---
function showMediaViewer(media) {
    const overlay = showModal(`
        <div class="modal modal--lg">
            <div class="modal__header">
                <span class="modal__title">${media.name}</span>
                <button class="modal__close">&times;</button>
            </div>
            <div class="modal__body">
                <div class="media-viewer">
                    ${media.type === 'video'
                        ? `<video src="${media.url}" controls autoplay style="max-width:100%;max-height:70vh"></video>`
                        : `<img src="${media.url}" alt="${media.name}">`}
                </div>
                <div style="margin-top:16px;font-size:14px;color:var(--color-text-secondary)">
                    <p>Tipo: ${media.type} | Tamano: ${formatBytes(media.file_size || 0)} | ${media.width || '?'}x${media.height || '?'} | ${media.mime_type || ''}</p>
                    ${media.duration ? `<p>Duracion: ${formatDuration(media.duration)}</p>` : ''}
                </div>
            </div>
        </div>
    `);
    overlay.querySelector('.modal__close').addEventListener('click', () => closeModal(overlay));
}

// --- Modal: Subir archivos ---
function showUploadModal(store, userId) {
    const overlay = showModal(`
        <div class="modal modal--lg">
            <div class="modal__header">
                <span class="modal__title">Subir Archivos</span>
                <button class="modal__close">&times;</button>
            </div>
            <div class="modal__body">
                <div class="upload-zone" id="upload-zone">
                    <div class="upload-zone__icon">\u{1F4C1}</div>
                    <div class="upload-zone__text">Arrastra archivos aqui o haz click para seleccionar</div>
                    <div class="upload-zone__hint">Formatos: JPG, PNG, GIF, WebP, SVG, MP4, WebM. Max 50 MB</div>
                </div>
                <input type="file" id="file-input" multiple accept="image/*,video/*" style="display:none">
                <div class="upload-queue" id="upload-queue"></div>
            </div>
            <div class="modal__footer">
                <button class="btn btn--secondary" id="btn-close-upload">Cerrar</button>
                <button class="btn btn--primary" id="btn-start-upload" disabled>Subir Archivos</button>
            </div>
        </div>
    `);

    let selectedFiles = [];
    const queueEl = overlay.querySelector('#upload-queue');
    const startBtn = overlay.querySelector('#btn-start-upload');
    const zone = overlay.querySelector('#upload-zone');
    const fileInput = overlay.querySelector('#file-input');

    overlay.querySelector('.modal__close').addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#btn-close-upload').addEventListener('click', () => closeModal(overlay));

    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('upload-zone--dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('upload-zone--dragover'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('upload-zone--dragover');
        addFiles(Array.from(e.dataTransfer.files));
    });
    fileInput.addEventListener('change', () => {
        addFiles(Array.from(fileInput.files));
        fileInput.value = '';
    });

    function addFiles(files) {
        selectedFiles = [...selectedFiles, ...files];
        renderQueue();
    }

    function renderQueue() {
        if (selectedFiles.length === 0) {
            queueEl.innerHTML = '';
            startBtn.disabled = true;
            return;
        }
        startBtn.disabled = false;
        queueEl.innerHTML = `
            <div class="upload-queue__title">Archivos seleccionados (${selectedFiles.length})</div>
            ${selectedFiles.map((f, i) => `
                <div class="upload-item" id="upload-item-${i}">
                    <div class="upload-item__icon">${f.type.startsWith('video/') ? '\u{1F3AC}' : '\u{1F5BC}'}</div>
                    <div class="upload-item__info">
                        <div class="upload-item__name">${f.name}</div>
                        <div class="upload-item__size">${formatBytes(f.size)}</div>
                    </div>
                    <button class="btn btn--ghost btn--sm" data-remove="${i}">\u2715</button>
                </div>
            `).join('')}`;

        queueEl.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedFiles.splice(parseInt(btn.dataset.remove), 1);
                renderQueue();
            });
        });
    }

    startBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;
        startBtn.disabled = true;
        startBtn.textContent = 'Subiendo...';

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const itemEl = overlay.querySelector(`#upload-item-${i}`);
            try {
                const fileExt = file.name.split('.').pop();
                const filePath = `${userId}/${Date.now()}-${file.name}`;
                const type = file.type.startsWith('video/') ? 'video' : 'image';

                await uploadFile('media', filePath, file);
                const url = getPublicUrl('media', filePath);

                await createMedia({
                    user_id: userId,
                    name: file.name,
                    type,
                    url,
                    file_size: file.size,
                    mime_type: file.type
                });

                if (itemEl) itemEl.querySelector('.upload-item__size').innerHTML = '<span style="color:var(--color-success)">\u2713 Completado</span>';
            } catch (err) {
                if (itemEl) itemEl.querySelector('.upload-item__size').innerHTML = `<span style="color:var(--color-error)">\u2715 ${err.message || 'Error'}</span>`;
            }
        }

        showToast(`${selectedFiles.length} archivo(s) subidos correctamente`, 'success');
        setTimeout(() => closeModal(overlay), 1000);
        loadMedia(store, userId);
    });
}
