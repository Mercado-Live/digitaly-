// ================================================================
// CARTELERA DIGITAL - modules/notifications.js
// Sistema de Toast de notificaciones
// ================================================================

export function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return { dismiss: () => {} };

    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.id = id;
    toast.innerHTML = `
        <span class="toast__icon">${iconMap[type] || iconMap.info}</span>
        <span class="toast__message">${message}</span>
        <button class="toast__close">&times;</button>
        ${duration > 0 ? '<div class="toast__progress"><div class="toast__progress-bar" style="animation-duration:' + duration + 'ms"></div></div>' : ''}
    `;

    toast.querySelector('.toast__close').addEventListener('click', () => dismissToast(id));

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    let timer;
    if (duration > 0) {
        timer = setTimeout(() => dismissToast(id), duration);
    }

    function dismissToast(toastId) {
        clearTimeout(timer);
        const el = document.getElementById(toastId);
        if (!el) return;
        el.classList.remove('toast--visible');
        el.classList.add('toast--hiding');
        setTimeout(() => el.remove(), 300);
    }

    return { id, dismiss: () => dismissToast(id) };
}

const iconMap = {
    success: '\u2713',
    error: '\u2715',
    warning: '\u26A0',
    info: '\u2139'
};
