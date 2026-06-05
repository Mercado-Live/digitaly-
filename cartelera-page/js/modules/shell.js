// ================================================================
// CARTELERA DIGITAL - modules/shell.js
// Renderizado del layout de la aplicacion (sidebar + header + content)
// ================================================================

import { t } from '../utils/i18n.js';
import { toggleTheme } from '../app.js';
import { signOut } from '../auth.js';

export function renderAppShell(store, router, contentHtml, pageTitle) {
    const state = store.getState();
    const user = state.user;
    const collapsed = state.sidebarCollapsed;
    const theme = state.theme;

    const userName = user?.profile?.full_name || user?.email?.split('@')[0] || 'Usuario';
    const userInitial = userName.charAt(0).toUpperCase();
    const currentPath = window.location.hash.slice(1) || '/dashboard';

    const html = `
    <div class="app-shell">
        <aside class="sidebar ${collapsed ? 'sidebar--collapsed' : ''}" id="sidebar">
            <div class="sidebar__logo">
                <div class="sidebar__logo-icon">CD</div>
                <span class="sidebar__logo-text">${t('appName')}</span>
                <button class="sidebar__toggle" id="sidebar-toggle" title="Colapsar menu">
                    ${collapsed ? '\u25B6' : '\u25C0'}
                </button>
            </div>
            <nav class="sidebar__nav">
                <div class="sidebar__section-title">Principal</div>
                ${navItem('/dashboard', '\u25A0', t('dashboard'), currentPath)}
                ${navItem('/devices', '\u25C9', t('devices'), currentPath)}
                ${navItem('/media', '\u25A3', t('media'), currentPath)}
                <div class="sidebar__section-title">Contenido</div>
                ${navItem('/playlists', '\u2630', t('playlists'), currentPath)}
                ${navItem('/schedules', '\u25C6', t('schedules'), currentPath)}
                <div class="sidebar__section-title">Sistema</div>
                ${navItem('/settings', '\u2699', t('settings'), currentPath, false)}
            </nav>
            <div class="sidebar__footer">
                <button class="nav-item" id="btn-logout">
                    <span class="nav-item__icon">\u21AA</span>
                    <span class="nav-item__text">${t('logout')}</span>
                </button>
            </div>
        </aside>
        <main class="main-content">
            <header class="header">
                <div class="header__left">
                    <button class="header__menu-btn" id="mobile-menu-btn" title="Menu">\u2630</button>
                    <h1 class="header__title" id="page-title">${pageTitle || t('dashboard')}</h1>
                </div>
                <div class="header__right">
                    <button class="theme-toggle" id="theme-toggle" title="Cambiar tema">
                        ${theme === 'dark' ? '\u2600' : '\u263D'}
                    </button>
                    <div class="dropdown" id="user-dropdown">
                        <button class="header__user-menu" id="user-menu-btn">
                            <div class="header__avatar">${userInitial}</div>
                            <span class="header__user-name">${userName}</span>
                            <span style="font-size:10px">\u25BC</span>
                        </button>
                        <div class="dropdown__menu">
                            <button class="dropdown__item" data-nav="settings">
                                \u2699 ${t('settings')}
                            </button>
                            <div class="dropdown__divider"></div>
                            <button class="dropdown__item dropdown__item--danger" id="btn-logout2">
                                \u21AA ${t('logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <div class="page-content" id="page-content">
                ${contentHtml}
            </div>
        </main>
    </div>`;

    const root = document.getElementById('app-root');
    root.innerHTML = html;

    // Bindings de sidebar
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        const newState = !store.getState().sidebarCollapsed;
        store.setState({ sidebarCollapsed: newState });
        localStorage.setItem('sidebarCollapsed', newState);
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('sidebar--collapsed', newState);
        const btn = document.getElementById('sidebar-toggle');
        btn.innerHTML = newState ? '\u25B6' : '\u25C0';
    });

    // Mobile menu
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('sidebar--mobile-open');
    });

    // Tema
    document.getElementById('theme-toggle').addEventListener('click', () => {
        toggleTheme(store);
    });

    // Logout
    const handleLogout = async () => {
        await signOut();
    };
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
    if (document.getElementById('btn-logout2')) {
        document.getElementById('btn-logout2').addEventListener('click', handleLogout);
    }

    // User dropdown
    const userBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');
    if (userBtn && dropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('dropdown--open');
        });
        document.addEventListener('click', () => dropdown.classList.remove('dropdown--open'));
    }

    // Navegacion del dropdown
    dropdown?.querySelectorAll('[data-nav]').forEach(btn => {
        btn.addEventListener('click', () => {
            dropdown.classList.remove('dropdown--open');
            router.navigate(btn.dataset.nav);
        });
    });

    // Cerrar sidebar mobile al navegar
    document.querySelectorAll('.nav-item[data-nav]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const path = item.dataset.nav;
            router.navigate(path);
            document.getElementById('sidebar').classList.remove('sidebar--mobile-open');
        });
    });
}

function navItem(path, icon, label, currentPath, useRouter = true) {
    const isActive = currentPath.startsWith(path);
    return `
        <a class="nav-item ${isActive ? 'nav-item--active' : ''}" data-nav="${path}" href="#/${path.replace(/^\//, '')}">
            <span class="nav-item__icon">${icon}</span>
            <span class="nav-item__text">${label}</span>
        </a>`;
}

export function updateSidebarActive(currentPath) {
    document.querySelectorAll('.nav-item').forEach(item => {
        const navPath = item.getAttribute('href')?.replace('#/', '') || '';
        const isActive = currentPath === '/' + navPath || currentPath.startsWith('/' + navPath + '/') || currentPath.startsWith('/' + navPath + '?');
        item.classList.toggle('nav-item--active', isActive);
    });
}
