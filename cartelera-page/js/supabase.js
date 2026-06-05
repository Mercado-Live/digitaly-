// ================================================================
// CARTELERA DIGITAL - supabase.js
// Cliente de Supabase: inicializacion, auth helpers
// ================================================================

// Configuracion - Reemplazar con valores reales de tu proyecto Supabase
const SUPABASE_URL = 'https://wntecetvtwsmylsxexgt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudGVjZXR2dHdzbXlsc3hleGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjkxMDgsImV4cCI6MjA5NjI0NTEwOH0.Rm27VzgfaZ_BZPTzFKkhKq7gLVOTt2_gayuZdJGxGa0';

let supabaseClient = null;

export function initSupabase() {
    if (!supabaseClient && typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                storage: window.localStorage,
                detectSessionInUrl: true
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        });
    }
    return supabaseClient;
}

export function getSupabase() {
    if (!supabaseClient) {
        throw new Error('Supabase no inicializado. Llama a initSupabase() primero.');
    }
    return supabaseClient;
}

// Usa el cliente Supabase global del CDN si no esta inicializado via modulo
export function ensureSupabase() {
    if (!supabaseClient && typeof window.supabase !== 'undefined') {
        return initSupabase();
    }
    return supabaseClient;
}
