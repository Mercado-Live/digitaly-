// ================================================================
// CARTELERA DIGITAL - modules/schedules.js
// Gestion de programaciones horarias
// ================================================================

import { renderAppShell } from './shell.js';
import { getUserSchedules, getUserDevices, getUserPlaylists, create, update, remove, fetchById } from '../api.js';
import { t } from '../utils/i18n.js';
import { showModal, closeModal } from '../utils/dom.js';
import { formatDate, formatTime, formatDaysList } from '../utils/format.js';
import { showToast } from './notifications.js';

export async function renderSchedulesListPage(store, router) {
    const userId = store.getState().user?.id;

    renderAppShell(store, router, `
        <div class="page-header">
            <div>
                <h2 class="page-title">${t('schedules')}</h2>
                <p class="page-subtitle">Programa contenido para fechas y horarios especificos</p>
            </div>
            <div class="page-actions">
                <button class="btn btn--primary" id="btn-new-schedule">+ Nueva Programacion</button>
            </div>
        </div>
        <div id="schedules-content">
            <div class="skeleton skeleton--card" style="height:80px;margin-bottom:12px"></div>
        </div>
    `, t('schedules'));

    document.getElementById('btn-new-schedule').addEventListener('click', () => router.navigate('/schedules/new'));

    if (userId) loadSchedules(store, router, userId);
}

async function loadSchedules(store, router, userId) {
    const container = document.getElementById('schedules-content');
    if (!container) return;

    try {
        const { data: schedules } = await getUserSchedules(userId);
        store.setState({ schedules: schedules || [] });

        if (!schedules || schedules.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">\u{1F4C5}</div>
                    <div class="empty-state__title">No hay programaciones</div>
                    <div class="empty-state__description">Crea programaciones para automatizar el contenido en fechas y horarios especificos.</div>
                    <button class="btn btn--primary" onclick="window.location.hash='#/schedules/new'">Crear Programacion</button>
                </div>`;
            return;
        }

        container.innerHTML = schedules.map(s => `
            <div class="card card--clickable schedule-list-item" data-schedule-id="${s.id}" style="margin-bottom:12px">
                <div class="schedule-list-item__icon">\u{1F4C5}</div>
                <div class="schedule-list-item__info">
                    <div class="schedule-list-item__name">${s.name}</div>
                    <div class="schedule-list-item__detail">
                        ${s.playlist_id ? 'Playlist asignada' : 'Sin playlist'} |
                        ${formatDate(s.start_date)} - ${formatDate(s.end_date)} |
                        ${formatDaysList(s.days_of_week)} |
                        ${formatTime(s.start_time)} - ${formatTime(s.end_time)}
                    </div>
                </div>
                <div class="schedule-list-item__meta">
                    <span class="badge ${s.is_active ? 'badge--success' : 'badge--neutral'}">${s.is_active ? 'Activo' : 'Inactivo'}</span>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-schedule-id]').forEach(card => {
            card.addEventListener('click', () => router.navigate('/schedules/' + card.dataset.scheduleId));
        });

    } catch (err) {
        console.error('Error cargando schedules:', err);
        container.innerHTML = '<div class="empty-state"><div class="empty-state__title">Error al cargar</div></div>';
    }
}

export async function renderScheduleEditorPage(store, router, scheduleId) {
    const userId = store.getState().user?.id;
    const isNew = scheduleId === 'new';

    let schedule = null;
    let playlists = [];
    let devices = [];

    try {
        const [plRes, devRes] = await Promise.all([
            getUserPlaylists(userId),
            getUserDevices(userId)
        ]);
        playlists = plRes.data || [];
        devices = devRes.data || [];

        if (!isNew) {
            schedule = await fetchById('schedules', scheduleId);
            store.setState({ currentSchedule: schedule });
        }
    } catch (err) {
        console.error('Error cargando datos:', err);
    }

    const days = schedule?.days_of_week || [1, 2, 3, 4, 5]; // L-V default
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

    renderAppShell(store, router, `
        <button class="device-detail__back" onclick="window.location.hash='#/schedules'">\u2190 Volver a programaciones</button>
        <div class="page-header">
            <h2 class="page-title">${isNew ? 'Nueva Programacion' : (schedule?.name || 'Editar Programacion')}</h2>
        </div>
        <div class="schedule-editor">
            <div class="card" style="margin-bottom:24px">
                <div class="schedule-editor__section">
                    <div class="schedule-editor__section-title">Datos Generales</div>
                    <div class="form-group">
                        <label class="form-label">Nombre</label>
                        <input class="form-input" type="text" id="sched-name" value="${schedule?.name || ''}" placeholder="Ej: Promociones Fin de Semana">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Playlist</label>
                        <select class="form-select" id="sched-playlist">
                            <option value="">-- Seleccionar --</option>
                            ${playlists.map(p => `<option value="${p.id}" ${schedule?.playlist_id === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Prioridad (mayor = mas importante)</label>
                        <select class="form-select" id="sched-priority">
                            <option value="1" ${schedule?.priority === 1 ? 'selected' : ''}>Baja</option>
                            <option value="2" ${schedule?.priority === 2 ? 'selected' : ''}>Media</option>
                            <option value="3" ${schedule?.priority === 3 ? 'selected' : ''}>Alta</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" id="sched-active" ${schedule ? (schedule.is_active ? 'checked' : '') : 'checked'}>
                            Activado
                        </label>
                    </div>
                </div>

                <div class="schedule-editor__section">
                    <div class="schedule-editor__section-title">Dispositivos</div>
                    <div class="device-selector" id="sched-devices">
                        ${devices.map(d => `
                            <label class="device-selector__item ${schedule?.device_ids?.includes(d.id) ? 'device-selector__item--selected' : ''}">
                                <input type="checkbox" value="${d.id}" ${schedule?.device_ids?.includes(d.id) ? 'checked' : ''}>
                                ${d.name || 'Sin nombre'}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="schedule-editor__section">
                    <div class="schedule-editor__section-title">Rango de Fechas</div>
                    <div class="date-row">
                        <div class="form-group">
                            <label class="form-label">Desde</label>
                            <input type="date" id="sched-start-date" value="${schedule?.start_date?.split('T')[0] || new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Hasta</label>
                            <input type="date" id="sched-end-date" value="${schedule?.end_date?.split('T')[0] || ''}">
                        </div>
                    </div>
                </div>

                <div class="schedule-editor__section">
                    <div class="schedule-editor__section-title">Dias y Horarios</div>
                    <div class="day-selector" id="day-selector" style="margin-bottom:16px">
                        ${dayNames.map((name, i) => `
                            <button class="day-btn ${days.includes(i) ? 'day-btn--selected' : ''}" data-day="${i}">${name}</button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="sched-days" value='${JSON.stringify(days)}'>
                    <div class="time-row">
                        <span class="time-row__label">Inicio</span>
                        <input type="time" id="sched-start-time" value="${schedule?.start_time || '08:00'}">
                        <span class="time-row__label">Fin</span>
                        <input type="time" id="sched-end-time" value="${schedule?.end_time || '20:00'}">
                    </div>
                </div>
            </div>

            <div style="display:flex;gap:12px;justify-content:flex-end">
                ${!isNew ? `<button class="btn btn--danger" id="btn-delete-schedule">Eliminar</button>` : ''}
                <button class="btn btn--secondary" onclick="window.location.hash='#/schedules'">Cancelar</button>
                <button class="btn btn--primary" id="btn-save-schedule">${isNew ? 'Crear Programacion' : 'Guardar Cambios'}</button>
            </div>
        </div>
    `, isNew ? 'Nueva Programacion' : (schedule?.name || 'Programacion'));

    // Bind day selector
    let selectedDays = [...days];
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = parseInt(btn.dataset.day);
            if (selectedDays.includes(day)) {
                selectedDays = selectedDays.filter(d => d !== day);
                btn.classList.remove('day-btn--selected');
            } else {
                selectedDays.push(day);
                btn.classList.add('day-btn--selected');
            }
        });
    });

    // Guardar
    document.getElementById('btn-save-schedule').addEventListener('click', async () => {
        const name = document.getElementById('sched-name').value.trim();
        const playlistId = document.getElementById('sched-playlist').value;
        const startDate = document.getElementById('sched-start-date').value;
        const endDate = document.getElementById('sched-end-date').value;
        const startTime = document.getElementById('sched-start-time').value;
        const endTime = document.getElementById('sched-end-time').value;
        const priority = parseInt(document.getElementById('sched-priority').value);
        const isActive = document.getElementById('sched-active').checked;
        const deviceIds = [...document.querySelectorAll('#sched-devices input[type="checkbox"]:checked')].map(cb => cb.value);

        if (!name) { showToast('El nombre es obligatorio', 'error'); return; }
        if (!playlistId) { showToast('Selecciona una playlist', 'warning'); return; }
        if (selectedDays.length === 0) { showToast('Selecciona al menos un dia', 'warning'); return; }

        const data = {
            user_id: userId,
            name,
            playlist_id: playlistId,
            device_ids: deviceIds,
            start_date: startDate,
            end_date: endDate || null,
            days_of_week: selectedDays.sort(),
            start_time: startTime,
            end_time: endTime,
            priority,
            is_active: isActive
        };

        try {
            if (isNew) {
                await create('schedules', data);
            } else {
                await update('schedules', scheduleId, data);
            }
            showToast(isNew ? 'Programacion creada' : 'Cambios guardados', 'success');
            router.navigate('/schedules');
        } catch (err) {
            showToast('Error al guardar: ' + (err.message || 'Error'), 'error');
        }
    });

    // Eliminar
    document.getElementById('btn-delete-schedule')?.addEventListener('click', async () => {
        if (!confirm(t('confirmDelete'))) return;
        try {
            await remove('schedules', scheduleId);
            showToast('Programacion eliminada', 'success');
            router.navigate('/schedules');
        } catch (err) {
            showToast('Error al eliminar', 'error');
        }
    });
}
