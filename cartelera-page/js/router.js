// ================================================================
// CARTELERA DIGITAL - router.js
// Sistema de enrutamiento SPA basado en hash
// ================================================================

export class Router {
    constructor(store, supabase) {
        this.store = store;
        this.supabase = supabase;
        this.routes = new Map();
        this.currentRoute = null;
        this.guards = [];
        this.params = {};
        this.query = {};
        this._rendering = false;

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    register(pattern, handler, options = {}) {
        this.routes.set(pattern, { handler, options });
        return this;
    }

    navigate(path) {
        const normalized = path.startsWith('#/') ? path : '#/' + path.replace(/^#?\//, '');
        window.location.hash = normalized;
    }

    replace(path) {
        const normalized = path.startsWith('#/') ? path : '#/' + path.replace(/^#?\//, '');
        window.history.replaceState(null, '', normalized);
        this.handleRoute();
    }

    addGuard(fn) {
        this.guards.push(fn);
        return this;
    }

    async handleRoute() {
        if (this._rendering) return;
        this._rendering = true;

        try {
            const hash = window.location.hash.slice(1) || '/login';
            const [path, queryString] = hash.split('?');

            this.query = {};
            if (queryString) {
                queryString.split('&').forEach(pair => {
                    const idx = pair.indexOf('=');
                    if (idx > 0) {
                        this.query[decodeURIComponent(pair.slice(0, idx))] = decodeURIComponent(pair.slice(idx + 1) || '');
                    }
                });
            }

            let matchedRoute = null;
            let matchedParams = {};

            for (const [pattern, route] of this.routes) {
                const result = this.matchRoute(pattern, path);
                if (result) {
                    matchedRoute = route;
                    matchedParams = result;
                    break;
                }
            }

            if (!matchedRoute) {
                await this.render404();
                return;
            }

            // Ejecutar guards
            for (const guard of this.guards) {
                const ok = await guard(matchedRoute.options);
                if (!ok) {
                    if (!this.store.getState().user) {
                        this.replace('/login');
                    }
                    this._rendering = false;
                    return;
                }
            }

            this.params = matchedParams;
            this.currentRoute = matchedRoute;
            await matchedRoute.handler(this.params, this.query);
        } catch (err) {
            console.error('Router error:', err);
            await this.render404();
        } finally {
            this._rendering = false;
        }
    }

    matchRoute(pattern, path) {
        const patternParts = pattern.replace(/^\/+|\/+$/g, '').split('/');
        const pathParts = path.replace(/^\/+|\/+$/g, '').split('/');

        if (patternParts.length !== pathParts.length) return null;
        const params = {};

        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
            } else if (patternParts[i].toLowerCase() !== pathParts[i].toLowerCase()) {
                return null;
            }
        }
        return params;
    }

    async render404() {
        const root = document.getElementById('app-root');
        if (root) {
            root.innerHTML = `
                <div class="empty-state" style="min-height:100vh">
                    <div class="empty-state__icon">404</div>
                    <div class="empty-state__title">Pagina no encontrada</div>
                    <div class="empty-state__description">La ruta que buscas no existe o fue movida.</div>
                    <button class="btn btn--primary" onclick="window.location.hash='#/dashboard'">
                        Ir al Panel
                    </button>
                </div>`;
        }
    }
}
