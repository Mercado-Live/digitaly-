// ================================================================
// CARTELERA DIGITAL - pages/register.js
// Pagina de registro de cuenta
// ================================================================

import { signUp } from '../auth.js';
import { showToast } from '../modules/notifications.js';
import { clearFieldErrors, showFieldError, validateEmail, validatePassword } from '../utils/validators.js';

export async function renderRegisterPage(store, router) {
    const root = document.getElementById('app-root');
    root.innerHTML = `
    <div class="auth-page">
        <div class="auth-card">
            <div class="auth-card__logo">
                <div class="auth-card__logo-icon">CD</div>
                <span class="auth-card__logo-text">Cartelera Digital</span>
            </div>
            <h2 class="auth-card__title">Crear Cuenta</h2>
            <p class="auth-card__subtitle">Comienza a gestionar tus pantallas digitales</p>

            <div id="auth-message"></div>

            <form class="auth-card__form" id="register-form" autocomplete="on">
                <div class="form-group">
                    <label class="form-label form-label--required" for="form-fullname">Nombre completo</label>
                    <input class="form-input" type="text" id="form-fullname" name="fullname"
                           placeholder="Tu nombre" autocomplete="name" required>
                    <span class="form-error" id="error-fullname"></span>
                </div>
                <div class="form-group">
                    <label class="form-label" for="form-company">Empresa / Organizacion</label>
                    <input class="form-input" type="text" id="form-company" name="company"
                           placeholder="Opcional" autocomplete="organization">
                </div>
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
                               placeholder="Minimo 6 caracteres" autocomplete="new-password" required>
                        <button type="button" class="form-password-toggle" id="toggle-password" tabindex="-1">\u25C9</button>
                    </div>
                    <span class="form-error" id="error-password"></span>
                </div>
                <div class="form-group">
                    <label class="form-label form-label--required" for="form-confirm">Confirmar contrasena</label>
                    <input class="form-input" type="password" id="form-confirm" name="confirm"
                           placeholder="Repite tu contrasena" autocomplete="new-password" required>
                    <span class="form-error" id="error-confirm"></span>
                </div>
                <button type="submit" class="btn btn--primary auth-card__submit" id="btn-register">
                    Crear Cuenta
                </button>
            </form>

            <div class="auth-card__footer">
                Ya tienes cuenta? <a href="#/login">Iniciar Sesion</a>
            </div>
        </div>
    </div>`;

    let pwVisible = false;
    document.getElementById('toggle-password').addEventListener('click', () => {
        pwVisible = !pwVisible;
        document.getElementById('form-password').type = pwVisible ? 'text' : 'password';
        document.getElementById('toggle-password').textContent = pwVisible ? '\u25CB' : '\u25C9';
    });

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-register');
        const fullName = document.getElementById('form-fullname').value.trim();
        const company = document.getElementById('form-company').value.trim();
        const email = document.getElementById('form-email').value.trim();
        const password = document.getElementById('form-password').value;
        const confirm = document.getElementById('form-confirm').value;
        const msgEl = document.getElementById('auth-message');

        clearFieldErrors();
        msgEl.innerHTML = '';

        let hasError = false;

        if (!fullName) { showFieldError('fullname', 'El nombre es obligatorio'); hasError = true; }
        const errEmail = validateEmail(email);
        if (errEmail) { showFieldError('email', errEmail); hasError = true; }
        const errPw = validatePassword(password);
        if (errPw) { showFieldError('password', errPw); hasError = true; }
        if (password !== confirm) { showFieldError('confirm', 'Las contrasenas no coinciden'); hasError = true; }
        if (hasError) return;

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner spinner--sm"></span> Creando...';

        try {
            await signUp(email, password, {
                full_name: fullName,
                company_name: company
            });

            msgEl.innerHTML = `
                <div class="auth-card__success">
                    \u2713 Cuenta creada exitosamente.
                    Revisa tu correo electronico para confirmar tu cuenta.
                </div>`;
            btn.textContent = 'Cuenta Creada';
        } catch (err) {
            const msg = err.message || 'Error al crear la cuenta.';
            msgEl.innerHTML = `<div class="auth-card__error">\u2715 ${msg}</div>`;
            btn.disabled = false;
            btn.textContent = 'Crear Cuenta';
        }
    });
}
