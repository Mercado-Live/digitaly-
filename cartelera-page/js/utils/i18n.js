// ================================================================
// CARTELERA DIGITAL - utils/i18n.js
// Internacionalizacion basica (ES / EN)
// ================================================================

const translations = {
    es: {
        appName: 'Cartelera Digital',
        dashboard: 'Panel de Control',
        devices: 'Dispositivos',
        media: 'Multimedia',
        playlists: 'Playlists',
        schedules: 'Programaciones',
        templates: 'Plantillas',
        settings: 'Configuracion',
        logout: 'Cerrar Sesion',
        login: 'Iniciar Sesion',
        register: 'Crear Cuenta',
        email: 'Correo electronico',
        password: 'Contrasena',
        confirmPassword: 'Confirmar contrasena',
        fullName: 'Nombre completo',
        companyName: 'Empresa',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        add: 'Agregar',
        upload: 'Subir',
        search: 'Buscar',
        filter: 'Filtrar',
        all: 'Todos',
        online: 'En linea',
        offline: 'Sin conexion',
        idle: 'En espera',
        noDevices: 'No tienes dispositivos aun',
        noMedia: 'No has subido contenido',
        noPlaylists: 'No has creado playlists',
        confirmDelete: 'Estas seguro de eliminar esto?',
        loading: 'Cargando...',
        back: 'Volver',
        close: 'Cerrar',
        name: 'Nombre',
        location: 'Ubicacion',
        actions: 'Acciones'
    },
    en: {
        appName: 'Digital Signage',
        dashboard: 'Dashboard',
        devices: 'Devices',
        media: 'Media',
        playlists: 'Playlists',
        schedules: 'Schedules',
        templates: 'Templates',
        settings: 'Settings',
        logout: 'Logout',
        login: 'Sign In',
        register: 'Sign Up',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        fullName: 'Full Name',
        companyName: 'Company',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        upload: 'Upload',
        search: 'Search',
        filter: 'Filter',
        all: 'All',
        online: 'Online',
        offline: 'Offline',
        idle: 'Idle',
        noDevices: 'No devices yet',
        noMedia: 'No media uploaded',
        noPlaylists: 'No playlists created',
        confirmDelete: 'Are you sure you want to delete this?',
        loading: 'Loading...',
        back: 'Back',
        close: 'Close',
        name: 'Name',
        location: 'Location',
        actions: 'Actions'
    }
};

let currentLang = localStorage.getItem('lang') || 'es';

export function t(key) {
    return translations[currentLang]?.[key] || translations['es'][key] || key;
}

export function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    window.dispatchEvent(new CustomEvent('lang-changed', { detail: lang }));
}

export function getLang() {
    return currentLang;
}
