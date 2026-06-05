// ================================================================
// CARTELERA DIGITAL - utils/validators.js
// Validacion de formularios
// ================================================================

export function validateEmail(email) {
    if (!email) return 'El email es obligatorio';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return 'Ingresa un email valido';
    return null;
}

export function validatePassword(password) {
    if (!password) return 'La contrasena es obligatoria';
    if (password.length < 6) return 'Minimo 6 caracteres';
    return null;
}

export function validateRequired(value, fieldName) {
    if (!value || (typeof value === 'string' && !value.trim())) {
        return `${fieldName} es obligatorio`;
    }
    return null;
}

export function validateForm(fields) {
    const errors = {};
    for (const [field, value] of Object.entries(fields)) {
        let error = null;
        switch (field) {
            case 'email': error = validateEmail(value); break;
            case 'password': error = validatePassword(value); break;
            default: error = validateRequired(value, field); break;
        }
        if (error) errors[field] = error;
    }
    return Object.keys(errors).length ? errors : null;
}

export function showFieldError(fieldName, message) {
    const input = document.getElementById(`form-${fieldName}`);
    const errorEl = document.getElementById(`error-${fieldName}`);
    if (input) input.classList.toggle('form-input--error', !!message);
    if (errorEl) errorEl.textContent = message || '';
}

export function clearFieldErrors() {
    document.querySelectorAll('.form-input--error').forEach(el => el.classList.remove('form-input--error'));
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}
