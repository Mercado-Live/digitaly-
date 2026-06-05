// ================================================================
// CARTELERA DIGITAL - utils/dom.js
// Helpers de manipulacion del DOM
// ================================================================

export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

export function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') { el.className = value; }
        else if (key === 'style' && typeof value === 'object') { Object.assign(el.style, value); }
        else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        }
        else if (key === 'dataset') { Object.assign(el.dataset, value); }
        else if (key === 'html') { el.innerHTML = value; }
        else { el.setAttribute(key, value); }
    }
    if (typeof children === 'string') { el.textContent = children; }
    else if (Array.isArray(children)) {
        for (const child of children) {
            if (typeof child === 'string') { el.appendChild(document.createTextNode(child)); }
            else if (child instanceof Node) { el.appendChild(child); }
        }
    }
    return el;
}

export function emptyElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
    return el;
}

export function showModal(modalHtml) {
    const container = document.getElementById('modal-container');
    if (!container) return;

    const overlay = createElement('div', { className: 'modal-overlay' });
    overlay.innerHTML = modalHtml;
    container.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('modal-overlay--open'));

    // Cerrar al click fuera o boton close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
    });

    const closeBtn = overlay.querySelector('.modal__close');
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal(overlay));

    return overlay;
}

export function closeModal(overlay) {
    if (!overlay) {
        const open = document.querySelector('.modal-overlay--open');
        if (open) closeModal(open);
        return;
    }
    overlay.classList.remove('modal-overlay--open');
    setTimeout(() => overlay.remove(), 300);
}

export function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

export function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return 'Hace un momento';
    if (diffSec < 3600) return `Hace ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `Hace ${Math.floor(diffSec / 3600)} h`;
    if (diffSec < 2592000) return `Hace ${Math.floor(diffSec / 86400)} dias`;
    return date.toLocaleDateString('es-ES');
}

export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}
