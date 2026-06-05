// ================================================================
// CARTELERA DIGITAL - modules/playlists.js
// Gestion de playlists con soporte de layouts por slide
// Cada slide tiene: layout_id + zonas con contenido asignado
// ================================================================

import { renderAppShell } from './shell.js';
import { getUserPlaylists, getUserMedia, getUserDevices, create, update, remove, fetchById } from '../api.js';
import { t } from '../utils/i18n.js';
import { formatDuration, showModal, closeModal, formatBytes } from '../utils/dom.js';
import { showToast } from './notifications.js';
import { LAYOUTS, getLayoutById } from './layouts.js';

export async function renderPlaylistsListPage(store, router) {
    const userId = store.getState().user?.id;
    renderAppShell(store, router, `
        <div class="page-header">
            <div><h2 class="page-title">Playlists</h2><p class="page-subtitle">Organiza slides con layouts y zonas de contenido</p></div>
            <div class="page-actions"><button class="btn btn--primary" id="btn-new-playlist">+ Nueva Playlist</button></div>
        </div>
        <div id="playlists-content"><div class="skeleton skeleton--card" style="height:80px;margin-bottom:12px"></div></div>
    `, 'Playlists');
    document.getElementById('btn-new-playlist').addEventListener('click', () => showNewPlaylistModal(store, router));
    if (userId) loadPlaylists(store, router, userId);
}

async function loadPlaylists(store, router, userId) {
    const container = document.getElementById('playlists-content');
    if (!container) return;
    try {
        const { data: playlists } = await getUserPlaylists(userId);
        store.setState({ playlists: playlists || [] });
        if (!playlists || playlists.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state__icon">\u{1F3B5}</div><div class="empty-state__title">No hay playlists</div><div class="empty-state__description">Crea tu primera playlist con layouts y zonas.</div><button class="btn btn--primary" id="btn-create-first">+ Crear Playlist</button></div>`;
            document.getElementById('btn-create-first')?.addEventListener('click', () => showNewPlaylistModal(store, router));
            return;
        }
        container.innerHTML = playlists.map(p => {
            const items = p.items || [];
            return `<div class="card card--clickable" data-playlist-id="${p.id}" style="margin-bottom:12px">
                <div class="playlist-card__header"><span class="playlist-card__name">${p.name}</span><span class="badge badge--info">${items.length} slides</span></div>
                <div class="playlist-card__meta"><span class="playlist-card__meta-item">\u{1F504} ${p.is_loop ? 'Loop' : 'Una vez'}</span><span class="playlist-card__meta-item">\u25C6 ${p.transition || 'Sin transicion'}</span>${p.description ? `<span>${p.description}</span>` : ''}</div>
            </div>`;
        }).join('');
        container.querySelectorAll('[data-playlist-id]').forEach(card => {
            card.addEventListener('click', () => router.navigate('/playlists/' + card.dataset.playlistId));
        });
    } catch (err) { container.innerHTML = '<div class="empty-state"><div class="empty-state__title">Error al cargar</div></div>'; }
}

function showNewPlaylistModal(store, router) {
    const overlay = showModal(`
        <div class="modal"><div class="modal__header"><span class="modal__title">Nueva Playlist</span><button class="modal__close">&times;</button></div>
        <div class="modal__body"><form id="new-playlist-form"><div class="form-group"><label class="form-label">Nombre</label><input class="form-input" type="text" id="pl-name" placeholder="Ej: Loop Mañana" required></div><div class="form-group"><label class="form-label">Descripcion</label><input class="form-input" type="text" id="pl-desc" placeholder="Opcional"></div></form></div>
        <div class="modal__footer"><button class="btn btn--secondary close-modal">Cancelar</button><button class="btn btn--primary" id="btn-save-playlist">Crear Playlist</button></div></div>`);
    overlay.querySelector('.modal__close,.close-modal')?.addEventListener('click', () => closeModal(overlay));
    overlay.querySelector('#btn-save-playlist').addEventListener('click', async () => {
        const name = overlay.querySelector('#pl-name').value.trim();
        if (!name) { showToast('El nombre es obligatorio', 'error'); return; }
        try {
            const playlist = await create('playlists', { user_id: store.getState().user.id, name, description: overlay.querySelector('#pl-desc').value.trim(), items: [], is_loop: true, transition: 'fade' });
            closeModal(overlay); showToast('Playlist creada', 'success'); router.navigate('/playlists/' + playlist.id);
        } catch (err) { showToast('Error: ' + (err.message || 'Error'), 'error'); }
    });
}

// ================================================================
// EDITOR DE PLAYLIST CON LAYOUTS
// ================================================================
export async function renderPlaylistEditorPage(store, router, playlistId) {
    const userId = store.getState().user?.id;
    try {
        const playlist = await fetchById('playlists', playlistId);
        store.setState({ currentPlaylist: playlist });
        const slides = playlist.items || [];
        const totalSec = slides.reduce((sum, s) => sum + (s.duration || 10), 0);
        renderAppShell(store, router, `
            <button class="device-detail__back" onclick="window.location.hash='#/playlists'">\u2190 Volver a playlists</button>
            <div class="page-header"><div><h2 class="page-title">${playlist.name}</h2><p class="page-subtitle">${playlist.description || 'Editor de slides con layouts'}</p></div>
            <div class="page-actions"><button class="btn btn--secondary" id="btn-assign-playlist">Asignar a dispositivos</button><button class="btn btn--ghost btn--danger" id="btn-delete-playlist">Eliminar</button></div></div>
            <div class="playlist-editor" style="grid-template-columns: 1fr 300px">
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                        <h3 style="font-size:16px;font-weight:600">Slides (${slides.length})</h3>
                        <button class="btn btn--primary btn--sm" id="btn-add-slide">+ Agregar Slide</button>
                    </div>
                    <div id="slides-container">${slides.length === 0 ? renderEmptySlides() : renderSlides(slides)}</div>
                    <div style="text-align:right;margin-top:12px;font-size:14px;color:var(--color-text-secondary)">Duracion total: ${formatDuration(totalSec)}</div>
                </div>
                <div>
                    <div class="card" style="position:sticky;top:80px">
                        <div class="card__title" style="margin-bottom:16px">Configuracion</div>
                        <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" type="text" id="edit-pl-name" value="${playlist.name}"></div>
                        <div class="form-group"><label class="form-label">Descripcion</label><input class="form-input" type="text" id="edit-pl-desc" value="${playlist.description || ''}"></div>
                        <div class="form-group"><label class="form-checkbox"><input type="checkbox" id="edit-pl-loop" ${playlist.is_loop ? 'checked' : ''}>Repetir en bucle</label></div>
                        <div class="form-group"><label class="form-label">Transicion</label><select class="form-select" id="edit-pl-transition"><option value="none" ${playlist.transition==='none'?'selected':''}>Ninguna</option><option value="fade" ${playlist.transition==='fade'?'selected':''}>Fundido</option><option value="slide" ${playlist.transition==='slide'?'selected':''}>Deslizar</option></select></div>
                        <button class="btn btn--primary w-full mt-4" id="btn-save-settings">Guardar Cambios</button>
                        <div class="playlist-preview" style="margin-top:16px">
                            <div class="card__title" style="margin-bottom:8px;font-size:14px">Previsualizacion</div>
                            <div class="playlist-preview__stage" id="preview-stage"><div class="preview-panel__placeholder">Sin slides</div></div>
                            <div class="playlist-preview__controls" style="margin-top:8px">
                                <button class="btn btn--icon btn--sm" id="preview-prev">\u23EE</button>
                                <button class="btn btn--icon btn--sm" id="preview-play">\u25B6</button>
                                <button class="btn btn--icon btn--sm" id="preview-next">\u23ED</button>
                                <span class="playlist-preview__time" id="preview-time">00:00 / ${formatDuration(totalSec)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`, playlist.name);

        bindPlaylistEditorEvents(store, router, playlist, slides, userId);

    } catch (err) { showToast('Error al cargar playlist', 'error'); router.navigate('/playlists'); }
}

// --- Renderizado de slides ---
function renderEmptySlides() {
    return `<div class="playlist-empty"><div class="playlist-empty__icon">\u{1F4F1}</div><div class="playlist-empty__text">Agrega slides con layouts para armar tu cartelera</div></div>`;
}

function renderSlides(slides) {
    return slides.map((slide, idx) => {
        const layout = getLayoutById(slide.layout_id);
        const layoutName = layout ? layout.name : 'Sin layout';
        const layoutIcon = layout ? layout.icon : '?';
        const zonesAssigned = slide.zones ? Object.values(slide.zones).filter(z => z.media_id).length : 0;
        const totalZones = layout ? layout.zones.length : 0;
        return `<div class="slide-item" data-slide-index="${idx}">
            <div class="slide-item__header" data-toggle-slide="${idx}">
                <span class="slide-item__drag">\u2630</span>
                <span class="slide-item__layout-icon">${layoutIcon}</span>
                <div class="slide-item__info"><div class="slide-item__name">${layoutName}</div>
                <div class="slide-item__zones">${layout ? layout.zones.map(z => {
                    const items = Array.isArray(slide.zones?.[z.id]) ? slide.zones[z.id] : [];
                    return `<span class="slide-item__zone-badge ${items.length > 0 ? 'slide-item__zone-badge--assigned' : ''}">${z.name}${items.length > 0 ? ' (' + items.length + ')' : ''}</span>`;
                }).join('') : ''}</div></div>
                <div class="slide-item__duration"><input type="number" value="${slide.duration || 10}" min="1" max="300" data-slide-duration="${idx}"><span style="font-size:11px;color:var(--color-text-tertiary)">seg</span></div>
                <div class="slide-item__actions"><button class="btn btn--ghost btn--sm" data-edit-slide="${idx}">Editar</button><button class="btn btn--ghost btn--sm" data-remove-slide="${idx}" style="color:var(--color-error)">\u2715</button></div>
            </div>
            <div class="slide-item__body" id="slide-body-${idx}">${renderSlideMiniLayout(slide, layout)}</div>
        </div>`;
    }).join('');
}

function renderSlideMiniLayout(slide, layout) {
    if (!layout) return '<div style="color:var(--color-text-tertiary);font-size:12px;padding:8px">Layout no encontrado</div>';
    return `<div class="slide-mini-layout">${layout.zones.map(z => {
        const items = Array.isArray(slide.zones?.[z.id]) ? slide.zones[z.id] : [];
        const count = items.length;
        const hasContent = count > 0;
        const firstUrl = hasContent ? items[0].media_url : null;
        return `<div class="slide-mini-layout__zone ${hasContent ? 'slide-mini-layout__zone--has-content' : ''}"
             style="left:${z.x}%;top:${z.y}%;width:${z.width}%;height:${z.height}%"
             title="${z.name}: ${count} item(s)">
            ${firstUrl ? `<img src="${firstUrl}" alt="">` : ''}
            <span class="slide-mini-layout__zone-label">${z.name}${hasContent ? ' (' + count + ')' : ''}</span>
        </div>`;
    }).join('')}</div>`;
}

// --- Bind de eventos del editor ---
function bindPlaylistEditorEvents(store, router, playlist, slides, userId) {
    const playlistId = playlist.id;
    let currentSlides = [];
    try {
        currentSlides = JSON.parse(JSON.stringify(slides || []));
    } catch (e) {
        currentSlides = [];
        console.error('Error parseando slides:', e);
    }

    async function save() {
        try {
            await update('playlists', playlistId, { items: currentSlides });
        } catch (e) {
            console.error('Error al guardar playlist:', e);
            showToast('Error al guardar: ' + (e.message || 'Error'), 'error');
        }
    }
    function refreshUI() {
        try {
            const container = document.getElementById('slides-container');
            if (!container) return;
            container.innerHTML = currentSlides.length === 0 ? renderEmptySlides() : renderSlides(currentSlides);
            bindSlideEvents();
            const totalSec = (currentSlides || []).reduce((s, sl) => s + ((sl && sl.duration) || 10), 0);
            const timeEl = document.getElementById('preview-time');
            if (timeEl) timeEl.textContent = `00:00 / ${formatDuration(totalSec)}`;
        } catch (e) {
            console.error('Error refrescando UI:', e);
        }
    }
    function bindSlideEvents() {
        try {
            document.querySelectorAll('[data-edit-slide]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    try { openLayoutEditor(parseInt(btn.dataset.editSlide)); } catch(err) { console.error('Error abriendo editor:', err); showToast('Error al abrir editor', 'error'); }
                });
            });
            document.querySelectorAll('[data-remove-slide]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        const idx = parseInt(btn.dataset.removeSlide);
                        if (idx >= 0 && idx < currentSlides.length) currentSlides.splice(idx, 1);
                        await save();
                        refreshUI();
                    } catch(err) { console.error('Error eliminando slide:', err); }
                });
            });
            document.querySelectorAll('[data-slide-duration]').forEach(input => {
                input.addEventListener('change', async () => {
                    try {
                        const idx = parseInt(input.dataset.slideDuration);
                        if (currentSlides[idx]) currentSlides[idx].duration = parseInt(input.value) || 10;
                        await save();
                    } catch(err) { console.error('Error cambiando duracion:', err); }
                });
            });
            document.querySelectorAll('[data-toggle-slide]').forEach(header => {
                header.addEventListener('click', () => {
                    try {
                        const idx = parseInt(header.dataset.toggleSlide);
                        const body = document.getElementById('slide-body-' + idx);
                        if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
                    } catch(err) { console.error('Error toggle slide:', err); }
                });
            });
        } catch(e) { console.error('Error bindSlideEvents:', e); }
    }

    // Agregar slide
    const addBtn = document.getElementById('btn-add-slide');
    if (addBtn) addBtn.addEventListener('click', () => {
        try {
            currentSlides.push({ layout_id: 'video-left-wide', zones: {}, duration: 10 });
            save().then(() => refreshUI()).catch(e => console.error('Error save en add:', e));
        } catch(e) { console.error('Error agregando slide:', e); }
    });

    // Configuracion
    const saveCfgBtn = document.getElementById('btn-save-settings');
    if (saveCfgBtn) saveCfgBtn.addEventListener('click', async () => {
        try {
            const nameEl = document.getElementById('edit-pl-name');
            const descEl = document.getElementById('edit-pl-desc');
            const loopEl = document.getElementById('edit-pl-loop');
            const transEl = document.getElementById('edit-pl-transition');
            if (!nameEl) return;
            await update('playlists', playlistId, {
                name: nameEl.value.trim(),
                description: descEl ? descEl.value.trim() : '',
                is_loop: loopEl ? loopEl.checked : true,
                transition: transEl ? transEl.value : 'fade'
            });
            showToast('Configuracion guardada', 'success');
        } catch (err) { showToast('Error al guardar: ' + (err.message || 'Error'), 'error'); }
    });

    // Eliminar
    const delBtn = document.getElementById('btn-delete-playlist');
    if (delBtn) delBtn.addEventListener('click', async () => {
        if (!confirm('Eliminar esta playlist?')) return;
        try { await remove('playlists', playlistId); showToast('Playlist eliminada', 'success'); router.navigate('/playlists'); } catch (err) { showToast('Error al eliminar: ' + (err.message || 'Error'), 'error'); }
    });

    // Asignar dispositivos
    const assignBtn = document.getElementById('btn-assign-playlist');
    if (assignBtn) assignBtn.addEventListener('click', () => showAssignDevicesModal(store, playlistId));

    // Drag & drop con Sortable
    try {
        if (typeof Sortable !== 'undefined') {
            const el = document.getElementById('slides-container');
            if (el && currentSlides.length > 1) {
                Sortable.create(el, { handle: '.slide-item__drag', animation: 150,
                    onEnd: async (evt) => {
                        try {
                            const moved = currentSlides.splice(evt.oldIndex, 1)[0];
                            currentSlides.splice(evt.newIndex, 0, moved);
                            await save();
                            refreshUI();
                        } catch(err) { console.error('Error reordenando:', err); }
                    }
                });
            }
        }
    } catch(e) { console.warn('Sortable no disponible o error:', e); }

    // Preview
    let previewIdx = 0, previewTimer = null, isPlaying = false;
    function showPreview(idx) {
        try {
            const stage = document.getElementById('preview-stage');
            const timeEl = document.getElementById('preview-time');
            if (!stage) return;
            if (!currentSlides || currentSlides.length === 0) { stage.innerHTML = '<div class="preview-panel__placeholder">Sin slides</div>'; return; }
            const slide = currentSlides[idx];
            if (!slide) { stage.innerHTML = '<div class="preview-panel__placeholder">Sin slide</div>'; return; }
            const layout = getLayoutById(slide.layout_id);
            if (!layout) { stage.innerHTML = '<div class="preview-panel__placeholder">Layout desconocido</div>'; return; }
            stage.style.position = 'relative';
            stage.style.background = layout.backgroundColor || '#000';
            stage.style.overflow = 'hidden';
            // Generar HTML con items arrays por zona
            stage.innerHTML = (layout.zones || []).map(z => {
                const items = Array.isArray(slide.zones?.[z.id]) ? slide.zones[z.id] : [];
                if (items.length === 0) {
                    return `<div style="position:absolute;left:${z.x}%;top:${z.y}%;width:${z.width}%;height:${z.height}%;overflow:hidden;display:flex;align-items:center;justify-content:center"><span style="color:rgba(255,255,255,0.2);font-size:14px">${z.name}</span></div>`;
                }
                // Mostrar todos los items en secuencia via JS
                const containerId = `preview-zone-${z.id}`;
                return `<div id="${containerId}" style="position:absolute;left:${z.x}%;top:${z.y}%;width:${z.width}%;height:${z.height}%;overflow:hidden"></div>`;
            }).join('');
            // Iniciar ciclo de items por zona
            (layout.zones || []).forEach(z => {
                const items = Array.isArray(slide.zones?.[z.id]) ? slide.zones[z.id] : [];
                if (items.length <= 1) {
                    const container = document.getElementById(`preview-zone-${z.id}`);
                    if (container && items[0] && items[0].media_url) {
                        container.innerHTML = z.type === 'video'
                            ? `<video src="${items[0].media_url}" autoplay muted loop style="width:100%;height:100%;object-fit:cover"></video>`
                            : `<img src="${items[0].media_url}" style="width:100%;height:100%;object-fit:cover">`;
                    }
                } else {
                    startZonePreviewCycle(`preview-zone-${z.id}`, items, z.type);
                }
            });
            const totalSec = (currentSlides || []).reduce((s, sl) => s + ((sl && sl.duration) || 10), 0);
            const elapsed = (currentSlides || []).slice(0, idx).reduce((s, sl) => s + ((sl && sl.duration) || 10), 0);
            if (timeEl) timeEl.textContent = `${formatDuration(elapsed)} / ${formatDuration(totalSec)}`;
        } catch(e) { console.error('Error en showPreview:', e); }
    }
    // Ciclo de items dentro de una zona
    const zoneTimers = {};
    function startZonePreviewCycle(containerId, items, zoneType) {
        if (zoneTimers[containerId]) clearInterval(zoneTimers[containerId]);
        let zoneItemIdx = 0;
        const container = document.getElementById(containerId);
        if (!container) return;
        function showZoneItem() {
            const item = items[zoneItemIdx];
            if (!item || !item.media_url) return;
            container.innerHTML = zoneType === 'video'
                ? `<video src="${item.media_url}" autoplay muted loop style="width:100%;height:100%;object-fit:cover"></video>`
                : `<img src="${item.media_url}" style="width:100%;height:100%;object-fit:cover">`;
            zoneItemIdx = (zoneItemIdx + 1) % items.length;
        }
        showZoneItem();
        zoneTimers[containerId] = setInterval(showZoneItem, (items[0]?.duration || 10) * 1000);
    }
    document.getElementById('preview-play')?.addEventListener('click', () => {
        try {
            if (isPlaying) {
                clearInterval(previewTimer);
                isPlaying = false;
                const playBtn = document.getElementById('preview-play');
                if (playBtn) playBtn.textContent = '\u25B6';
            } else {
                isPlaying = true;
                const playBtn = document.getElementById('preview-play');
                if (playBtn) playBtn.textContent = '\u23F8';
                showPreview(previewIdx);
                const duration = ((currentSlides[previewIdx] && currentSlides[previewIdx].duration) || 10) * 1000;
                previewTimer = setInterval(() => {
                    previewIdx = (previewIdx + 1) % (currentSlides.length || 1);
                    showPreview(previewIdx);
                }, Math.max(duration, 2000));
            }
        } catch(e) { console.error('Error preview play:', e); }
    });
    document.getElementById('preview-next')?.addEventListener('click', () => {
        try { previewIdx = (previewIdx + 1) % (currentSlides.length || 1); showPreview(previewIdx); } catch(e) {}
    });
    document.getElementById('preview-prev')?.addEventListener('click', () => {
        try { previewIdx = (previewIdx - 1 + currentSlides.length) % (currentSlides.length || 1); showPreview(previewIdx); } catch(e) {}
    });

    // --- Modal: Editor de layout del slide (MULTI-ITEM) ---
    async function openLayoutEditor(slideIdx) {
        try {
            if (!currentSlides[slideIdx]) { showToast('Slide no encontrado', 'error'); return; }
            const slide = { ...currentSlides[slideIdx] };
            if (!slide.layout_id) slide.layout_id = 'video-left-wide';
            if (!slide.zones || typeof slide.zones !== 'object') slide.zones = {};

            let mediaItems = [];
            try { const { data } = await getUserMedia(userId, { limit: 200 }); mediaItems = data || []; } catch (e) {}

            const overlay = showModal(`<div class="modal modal--xl"><div class="modal__header"><span class="modal__title">Editar Slide #${slideIdx + 1} — Multi-contenido</span><button class="modal__close">&times;</button></div>
        <div class="modal__body"><div class="layout-editor-modal">
            <div class="layout-editor-modal__canvas"><div class="layout-canvas" id="layout-canvas-${slideIdx}"></div></div>
            <div class="layout-editor-modal__panel">
                <div class="form-group"><label class="form-label">Layout</label><select class="form-select" id="slide-layout-select">${LAYOUTS.map(l => `<option value="${l.id}" ${slide.layout_id===l.id?'selected':''}>${l.icon} ${l.name}</option>`).join('')}</select></div>
                <div class="size-guide" id="size-guide-text">${getLayoutById(slide.layout_id)?.sizeGuide ? Object.entries(getLayoutById(slide.layout_id).sizeGuide).map(([z,g]) => '<strong>' + z + ':</strong> ' + g).join('<br>') : ''}</div>
                <div id="zone-detail-panel" style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:12px">Selecciona una zona en el canvas</div>
            </div>
        </div></div>
        <div class="modal__footer"><button class="btn btn--secondary close-modal">Cancelar</button><button class="btn btn--primary" id="btn-save-slide">Aplicar Cambios</button></div></div>`);

            if (!overlay) return;
            let layoutData = getLayoutById(slide.layout_id) || LAYOUTS[0];

            // Normalizar zones: convertir objetos viejos a arrays
            let zonesAssign = {};
            try {
                const raw = JSON.parse(JSON.stringify(slide.zones || {}));
                for (const [key, val] of Object.entries(raw)) {
                    if (Array.isArray(val)) zonesAssign[key] = val;
                    else if (val && typeof val === 'object' && val.media_id) zonesAssign[key] = [val];
                    else zonesAssign[key] = [];
                }
                // Asegurar keys para todas las zonas del layout
                for (const z of layoutData.zones) {
                    if (!zonesAssign[z.id]) zonesAssign[z.id] = [];
                }
            } catch(e) { zonesAssign = {}; }

            const canvas = overlay.querySelector(`#layout-canvas-${slideIdx}`);
            const selectLayout = overlay.querySelector('#slide-layout-select');
            const detailPanel = overlay.querySelector('#zone-detail-panel');
            const sizeGuide = overlay.querySelector('#size-guide-text');
            if (!canvas || !selectLayout || !detailPanel) return;

            function renderCanvas() {
                try {
                    canvas.innerHTML = '';
                    canvas.style.background = layoutData.backgroundColor || '#000';
                    let activeZoneId = canvas.dataset.activeZone || '';
                    (layoutData.zones || []).forEach(z => {
                        const items = Array.isArray(zonesAssign[z.id]) ? zonesAssign[z.id] : [];
                        const count = items.length;
                        const hasContent = count > 0;
                        const zoneDiv = document.createElement('div');
                        zoneDiv.className = `layout-canvas__zone ${hasContent ? 'layout-canvas__zone--assigned' : ''} ${activeZoneId === z.id ? 'layout-canvas__zone--active' : ''}`;
                        zoneDiv.style.cssText = `left:${z.x}%;top:${z.y}%;width:${z.width}%;height:${z.height}%`;
                        if (hasContent && items[0].media_url) {
                            zoneDiv.innerHTML = `<img src="${items[0].media_url}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.6">`;
                        }
                        zoneDiv.innerHTML += `<span class="layout-canvas__zone-label ${hasContent ? 'layout-canvas__zone-label--assigned' : ''}" style="position:absolute;bottom:4px;left:0;right:0">${z.name}${count > 0 ? ` — ${count} item(s)` : ''}${z.recommendedSize ? '<br><small>' + z.recommendedSize + '</small>' : ''}</span>`;
                        zoneDiv.addEventListener('click', () => selectZone(z.id));
                        canvas.appendChild(zoneDiv);
                    });
                } catch(e) { console.error('Error renderizando canvas:', e); }
            }

            function selectZone(zoneId) {
                try {
                    canvas.dataset.activeZone = zoneId;
                    renderCanvas();
                    const zone = layoutData.zones.find(z => z.id === zoneId);
                    if (!zone) return;
                    const items = Array.isArray(zonesAssign[zoneId]) ? zonesAssign[zoneId] : [];

                    // Filtrar media compatible
                    const filteredMedia = mediaItems.filter(m =>
                        (zone.acceptsTypes && zone.acceptsTypes.includes(m.type)) ||
                        (zone.acceptsTypes && zone.acceptsTypes.includes('image') && (m.type === 'image-story'))
                    );

                    // Lista de items asignados
                    const itemsListHtml = items.length === 0
                        ? '<div class="zone-assigner__empty">Sin contenido. Agrega items abajo.</div>'
                        : `<div class="zone-items-list">${items.map((item, i) => `
                            <div class="zone-item-row" data-item-idx="${i}">
                                <div class="zone-item-row__thumb">${item.media_type === 'video' ? '<div style="background:#000;width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:10px">\u25B6</div>' : (item.media_url ? `<img src="${item.media_url}" alt="">` : '')}</div>
                                <div class="zone-item-row__name">${item.media_name || 'Item ' + (i+1)}</div>
                                <div class="zone-item-row__duration"><input type="number" value="${item.duration || 10}" min="1" max="300" data-zone-duration="${zoneId}" data-duration-idx="${i}" style="width:45px"> seg</div>
                                <button class="zone-item-row__remove" data-zone-remove="${zoneId}" data-remove-idx="${i}" title="Quitar">\u2715</button>
                            </div>
                        `).join('')}</div>`;

                    // Picker para agregar
                    const pickerHtml = filteredMedia.length === 0
                        ? '<div style="text-align:center;padding:12px;font-size:11px;color:var(--color-text-tertiary)">No hay contenido compatible</div>'
                        : `<div class="zone-assigner__picker">${filteredMedia.map(m => {
                            const alreadyInZone = items.some(item => item.media_id === m.id);
                            return `<div class="zone-assigner__picker-item ${alreadyInZone ? 'zone-assigner__picker-item--selected' : ''}" data-pick-media="${m.id}" data-pick-zone="${zoneId}"><div class="zone-assigner__picker-thumb">${m.type === 'video' ? '<div style="background:#000;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:1.3rem">\u25B6</div>' : `<img src="${m.thumbnail_url || m.url}" alt="" loading="lazy">`}</div><div class="zone-assigner__picker-name">${m.name}${alreadyInZone ? ' \u2713' : ''}</div></div>`;
                        }).join('')}</div>`;

                    detailPanel.innerHTML = `
                        <div class="zone-assigner__header">
                            <div>
                                <span class="zone-assigner__zone-name">${zone.name}</span>
                                <span class="zone-assigner__zone-type">${zone.type} \u00B7 max ${zone.maxItems || 10} items</span>
                            </div>
                        </div>
                        <p style="font-size:11px;color:var(--color-text-tertiary);margin-bottom:8px">${zone.description}</p>
                        <div style="font-size:10px;color:var(--color-text-tertiary);margin-bottom:12px;background:var(--color-bg-secondary);padding:6px 8px;border-radius:4px">
                            <strong>\u{1F4D0} ${zone.resolution || ''}</strong> — ${zone.recommendedSize || ''}<br>${zone.tips || ''}
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                            <span style="font-size:12px;font-weight:600">Items asignados (${items.length})</span>
                            ${items.length > 0 ? `<button class="btn btn--ghost btn--sm" style="font-size:10px;color:var(--color-error)" data-clear-zone="${zoneId}">Limpiar todo</button>` : ''}
                        </div>
                        ${itemsListHtml}
                        <button class="zone-add-btn" style="margin-top:8px">+ Agregar contenido a ${zone.name}</button>
                        <div style="margin-top:8px">${pickerHtml}</div>`;

                    // Bind: click en picker item para agregar/quitar
                    detailPanel.querySelectorAll('.zone-assigner__picker-item').forEach(pickItem => {
                        pickItem.addEventListener('click', () => {
                            try {
                                const mediaId = pickItem.dataset.pickMedia;
                                const zId = pickItem.dataset.pickZone;
                                const existingIdx = zonesAssign[zId].findIndex(i => i.media_id === mediaId);
                                if (existingIdx >= 0) {
                                    zonesAssign[zId].splice(existingIdx, 1);
                                } else {
                                    if (zonesAssign[zId].length >= (zone.maxItems || 10)) {
                                        showToast(`Maximo ${zone.maxItems} items en esta zona`, 'warning');
                                        return;
                                    }
                                    const media = mediaItems.find(m => m.id === mediaId);
                                    if (media) {
                                        zonesAssign[zId].push({
                                            media_id: media.id,
                                            duration: media.type === 'video' ? (media.duration || 15) : 8,
                                            media_url: media.thumbnail_url || media.url,
                                            media_name: media.name,
                                            media_type: media.type
                                        });
                                    }
                                }
                                renderCanvas();
                                selectZone(zId);
                            } catch(e) { console.error('Error en pick:', e); }
                        });
                    });

                    // Bind: remover item individual
                    detailPanel.querySelectorAll('[data-zone-remove]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const zId = btn.dataset.zoneRemove;
                            const idx = parseInt(btn.dataset.removeIdx);
                            if (zonesAssign[zId] && idx >= 0 && idx < zonesAssign[zId].length) {
                                zonesAssign[zId].splice(idx, 1);
                                renderCanvas();
                                selectZone(zId);
                            }
                        });
                    });

                    // Bind: limpiar toda la zona
                    const clearAllBtn = detailPanel.querySelector('[data-clear-zone]');
                    if (clearAllBtn) clearAllBtn.addEventListener('click', () => {
                        zonesAssign[zoneId] = [];
                        renderCanvas();
                        selectZone(zoneId);
                    });

                    // Bind: cambiar duracion de item
                    detailPanel.querySelectorAll('[data-zone-duration]').forEach(input => {
                        input.addEventListener('change', () => {
                            const zId = input.dataset.zoneDuration;
                            const idx = parseInt(input.dataset.durationIdx);
                            if (zonesAssign[zId] && zonesAssign[zId][idx]) {
                                zonesAssign[zId][idx].duration = parseInt(input.value) || 10;
                            }
                        });
                    });

                } catch(e) { console.error('Error en selectZone:', e); }
            }

            renderCanvas();

            selectLayout.addEventListener('change', () => {
                try {
                    layoutData = getLayoutById(selectLayout.value) || LAYOUTS[0];
                    zonesAssign = {};
                    for (const z of layoutData.zones) zonesAssign[z.id] = [];
                    slide.layout_id = selectLayout.value;
                    canvas.dataset.activeZone = '';
                    renderCanvas();
                    detailPanel.innerHTML = '<div style="font-size:12px;color:var(--color-text-tertiary);text-align:center;padding:20px">Selecciona una zona para asignar contenido</div>';
                    if (sizeGuide && layoutData.sizeGuide) {
                        sizeGuide.innerHTML = Object.entries(layoutData.sizeGuide).map(([z,g]) => '<strong>' + z + ':</strong> ' + g).join('<br>');
                    }
                } catch(e) { console.error('Error cambiando layout:', e); }
            });

            overlay.querySelector('.modal__close, .close-modal')?.addEventListener('click', () => closeModal(overlay));

            overlay.querySelector('#btn-save-slide')?.addEventListener('click', () => {
                try {
                    // Calcular duracion total del slide (la zona mas larga)
                    let maxDuration = 10;
                    for (const items of Object.values(zonesAssign)) {
                        if (Array.isArray(items)) {
                            const sum = items.reduce((s, i) => s + ((i && i.duration) || 10), 0);
                            if (sum > maxDuration) maxDuration = sum;
                        }
                    }
                    const newSlide = { layout_id: layoutData.id, zones: zonesAssign, duration: maxDuration };
                    if (slideIdx >= 0 && slideIdx < currentSlides.length) {
                        currentSlides[slideIdx] = newSlide;
                    }
                    save().then(() => { closeModal(overlay); refreshUI(); showToast('Slide actualizado', 'success'); }).catch(e => { console.error('Error guardando slide:', e); showToast('Error al guardar slide', 'error'); });
                } catch(e) { console.error('Error en btn-save-slide:', e); }
            });
        } catch(e) {
            console.error('Error en openLayoutEditor:', e);
            showToast('Error al abrir el editor de layout', 'error');
        }
    }

    bindSlideEvents();
}

// --- Modal: Asignar playlist a dispositivos ---
async function showAssignDevicesModal(store, playlistId) {
    try {
        const userId = store.getState().user?.id;
        let devices = [];
        try { const res = await getUserDevices(userId); devices = res.data || []; } catch (e) {}
        const overlay = showModal(`<div class="modal"><div class="modal__header"><span class="modal__title">Asignar a Dispositivos</span><button class="modal__close">&times;</button></div>
    <div class="modal__body">${devices.length === 0 ? '<p style="text-align:center;color:var(--color-text-secondary)">No tienes dispositivos.</p>' : `<div class="device-selector">${devices.map(d => `<label class="device-selector__item"><input type="checkbox" value="${d.id}" ${d.current_playlist_id===playlistId?'checked':''}>${d.name||'Sin nombre'}</label>`).join('')}</div>`}</div>
    <div class="modal__footer"><button class="btn btn--secondary close-modal">Cancelar</button><button class="btn btn--primary" id="btn-confirm-assign">Asignar</button></div></div>`);
        overlay.querySelector('.modal__close,.close-modal')?.addEventListener('click', () => closeModal(overlay));
        overlay.querySelector('#btn-confirm-assign')?.addEventListener('click', async () => {
            const checked = [...overlay.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
            try { for (const deviceId of checked) { await update('devices', deviceId, { current_playlist_id: playlistId }); } closeModal(overlay); showToast(`Asignada a ${checked.length} dispositivo(s)`, 'success'); } catch (err) { showToast('Error al asignar: ' + (err.message || 'Error'), 'error'); }
        });
    } catch(e) { console.error('Error en showAssignDevicesModal:', e); }
}
