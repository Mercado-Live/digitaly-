// ================================================================
// CARTELERA DIGITAL - utils/format.js
// Formateo de fechas, tamanos, duraciones
// ================================================================

export function formatDate(dateStr, options = {}) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const opts = {
        year: 'numeric',
        month: options.short ? 'short' : 'long',
        day: 'numeric',
        ...options
    };
    return date.toLocaleDateString('es-ES', opts);
}

export function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

export function formatTime(timeStr) {
    if (!timeStr) return '—';
    return timeStr.substring(0, 5);
}

export function formatDayName(dayIndex) {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return days[dayIndex] || '?';
}

export function formatDaysList(daysArray) {
    if (!daysArray || !daysArray.length) return '—';
    return daysArray.map(d => formatDayName(d)).join(', ');
}

export function formatMediaType(type) {
    const map = { image: 'Imagen', video: 'Video', 'image-story': 'Historia' };
    return map[type] || type || '—';
}

export function formatTransition(type) {
    const map = { none: 'Ninguna', fade: 'Fundido', slide: 'Deslizar', zoom: 'Zoom' };
    return map[type] || type || 'none';
}

export function formatStatus(status) {
    const map = { online: 'En linea', offline: 'Sin conexion', idle: 'En espera', playing: 'Reproduciendo' };
    return map[status] || status || '—';
}
