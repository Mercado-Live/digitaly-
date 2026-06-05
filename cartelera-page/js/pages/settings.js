// ================================================================
// CARTELERA DIGITAL - pages/settings.js
// Configuracion de cuenta y perfil
// ================================================================

import { renderAppShell } from '../modules/shell.js';
import { updateProfile, updatePassword, signOut } from '../auth.js';
import { t } from '../utils/i18n.js';
import { showToast } from '../modules/notifications.js';

export async function renderSettingsPage(store, router) {
    const state = store.getState();
    const user = state.user;
    const profile = user?.profile || {};

    renderAppShell(store, router, `
        <div class="page-header">
            <h2 class="page-title">${t('settings')}</h2>
        </div>
        <div class="row" style="max-width:800px">
            <div class="col-12 col-md-6" style="margin-bottom:24px">
                <div class="card">
                    <div class="card__title" style="margin-bottom:16px">Datos del Perfil</div>
                    <div class="form-group">
                        <label class="form-label">Nombre completo</label>
                        <input class="form-input" type="text" id="set-name" value="${profile.full_name || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Empresa</label>
                        <input class="form-input" type="text" id="set-company" value="${profile.company_name || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input class="form-input" type="email" value="${user?.email || ''}" disabled style="opacity:0.6">
                    </div>
                    <button class="btn btn--primary" id="btn-save-profile">Guardar Perfil</button>
                </div>
            </div>

            <div class="col-12 col-md-6" style="margin-bottom:24px">
                <div class="card">
                    <div class="card__title" style="margin-bottom:16px">Cambiar Contrasena</div>
                    <form id="password-form">
                        <div class="form-group">
                            <label class="form-label">Nueva contrasena</label>
                            <input class="form-input" type="password" id="set-pw" placeholder="Minimo 6 caracteres" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Confirmar contrasena</label>
                            <input class="form-input" type="password" id="set-pw-confirm" placeholder="Repite la contrasena" required>
                        </div>
                        <span class="form-error" id="password-error"></span>
                        <button type="submit" class="btn btn--secondary">Cambiar Contrasena</button>
                    </form>
                </div>
            </div>

            <div class="col-12 col-md-6" style="margin-bottom:24px">
                <div class="card">
                    <div class="card__title" style="margin-bottom:16px">Informacion del Plan</div>
                    <div style="font-size:14px;color:var(--color-text-secondary)">
                        <p><strong>Plan:</strong> ${profile.plan === 'free' ? 'Gratuito' : profile.plan || 'Gratuito'}</p>
                        <p><strong>Dispositivos maximos:</strong> ${profile.max_devices || 3}</p>
                        <p><strong>Miembro desde:</strong> ${new Date(profile.created_at).toLocaleDateString('es-ES') || '—'}</p>
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-6" style="margin-bottom:24px">
                <div class="card">
                    <div class="card__title" style="margin-bottom:16px">Sesion</div>
                    <p style="font-size:14px;color:var(--color-text-secondary);margin-bottom:16px">
                        Has iniciado sesion como <strong>${user?.email || ''}</strong>
                    </p>
                    <button class="btn btn--danger" id="btn-logout-settings">Cerrar Sesion</button>
                </div>
            </div>
        </div>
    `, t('settings'));

    // Guardar perfil
    document.getElementById('btn-save-profile').addEventListener('click', async () => {
        try {
            await updateProfile(user.id, {
                full_name: document.getElementById('set-name').value.trim(),
                company_name: document.getElementById('set-company').value.trim()
            });
            showToast('Perfil actualizado', 'success');
        } catch (err) {
            showToast('Error al guardar: ' + (err.message || 'Error'), 'error');
        }
    });

    // Cambiar contrasena
    document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pw = document.getElementById('set-pw').value;
        const confirm = document.getElementById('set-pw-confirm').value;
        const errorEl = document.getElementById('password-error');

        if (pw.length < 6) { errorEl.textContent = 'Minimo 6 caracteres'; return; }
        if (pw !== confirm) { errorEl.textContent = 'Las contrasenas no coinciden'; return; }
        errorEl.textContent = '';

        try {
            await updatePassword(pw);
            showToast('Contrasena actualizada correctamente', 'success');
            document.getElementById('set-pw').value = '';
            document.getElementById('set-pw-confirm').value = '';
        } catch (err) {
            showToast('Error: ' + (err.message || 'Error'), 'error');
        }
    });

    // Logout
    document.getElementById('btn-logout-settings').addEventListener('click', () => signOut());
}
