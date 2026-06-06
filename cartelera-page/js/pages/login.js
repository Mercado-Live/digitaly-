// ================================================================
// CARTELERA DIGITAL - pages/login.js
// Pagina de inicio de sesion
// ================================================================

import { signIn } from '../auth.js';
import { showToast } from '../modules/notifications.js';
import { clearFieldErrors, showFieldError, validateRequired } from '../utils/validators.js';

export async function renderLoginPage(store, router) {
    const root = document.getElementById('app-root');
    root.innerHTML = `
    <div class="auth-page">
        <div class="auth-brand">
            <div class="auth-brand__header">
                <div class="auth-brand__icon">CD</div>
                <span class="auth-brand__name">Cartelera Digital</span>
            </div>

            <div class="auth-brand__body">
                <div class="auth-brand__tag">App Android TV</div>
                <h1 class="auth-brand__title">
                    Gestiona tus<br>pantallas desde<br>cualquier lugar
                </h1>
                <p class="auth-brand__desc">
                    Controla tu cartelera digital, programa contenido en tiempo real
                    y llega a tu audiencia desde una sola plataforma.
                </p>

                <a href="https://github.com/Mercado-Live/digitaly-/releases/download/v1.0.0/app-release.apk"
                   class="auth-brand__download" download>
                    <span class="auth-brand__download-icon">&#9660;</span>
                    <span>
                        Descargar APK
                        <span class="auth-brand__download-sub">Android TV &bull; v1.0.0</span>
                    </span>
                </a>
            </div>

            <div class="auth-brand__footer">
                <span class="auth-brand__footer-item">&copy; 2026 Cartelera Digital</span>
                <span class="auth-brand__footer-item">Hecho en Chile</span>
            </div>
        </div>

        <div class="auth-panel">
            <div class="auth-card">
                <h2 class="auth-card__title">Iniciar sesion</h2>
                <p class="auth-card__subtitle">Ingresa tus credenciales para acceder al panel</p>

                <div id="auth-message"></div>

                <form class="auth-card__form" id="login-form" autocomplete="on">
                    <div class="form-group">
                        <label class="form-label form-label--required" for="form-email">Correo electronico</label>
                        <input class="form-input" type="email" id="form-email" name="email"
                               placeholder="tu@empresa.com" autocomplete="email" required>
                        <span class="form-error" id="error-email"></span>
                    </div>
                    <div class="form-group">
                        <label class="form-label form-label--required" for="form-password">Contrasena</label>
                        <div class="form-password-wrapper">
                            <input class="form-input" type="password" id="form-password" name="password"
                                   placeholder="Tu contrasena" autocomplete="current-password" required>
                            <button type="button" class="form-password-toggle" id="toggle-password" tabindex="-1">\u25C9</button>
                        </div>
                        <span class="form-error" id="error-password"></span>
                    </div>
                    <button type="submit" class="auth-card__submit" id="btn-login">
                        Iniciar Sesion
                    </button>
                </form>

                <div class="auth-card__footer">
                    No tienes cuenta? <a href="#/register">Crear una cuenta</a>
                </div>
            </div>
        </div>
    </div>`;

    // Toggle visibilidad de password
    let pwVisible = false;
    document.getElementById('toggle-password').addEventListener('click', () => {
        pwVisible = !pwVisible;
        const input = document.getElementById('form-password');
        input.type = pwVisible ? 'text' : 'password';
        document.getElementById('toggle-password').textContent = pwVisible ? '\u25CB' : '\u25C9';
    });

    // Submit
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-login');
        const email = document.getElementById('form-email').value.trim();
        const password = document.getElementById('form-password').value;
        const msgEl = document.getElementById('auth-message');

        clearFieldErrors();
        msgEl.innerHTML = '';

        let hasError = false;
        const errEmail = validateRequired(email, 'El email');
        const errPw = validateRequired(password, 'La contrasena');
        if (errEmail) { showFieldError('email', errEmail); hasError = true; }
        if (errPw) { showFieldError('password', errPw); hasError = true; }
        if (hasError) return;

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner spinner--sm"></span> Iniciando...';

        try {
            await signIn(email, password);
        } catch (err) {
            const msg = err.message === 'Invalid login credentials'
                ? 'Email o contrasena incorrectos.'
                : err.message || 'Error al iniciar sesion.';
            msgEl.innerHTML = `<div class="auth-card__error">\u2715 ${msg}</div>`;
            btn.disabled = false;
            btn.textContent = 'Iniciar Sesion';
        }
    });
}
