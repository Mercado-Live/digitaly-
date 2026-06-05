// ================================================================
// CARTELERA DIGITAL - auth.js
// Logica de autenticacion: login, registro, logout, sesion
// ================================================================

import { ensureSupabase } from './supabase.js';

export async function signIn(email, password) {
    const supabase = ensureSupabase();
    if (!supabase) throw new Error('Supabase no disponible');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signUp(email, password, metadata = {}) {
    const supabase = ensureSupabase();
    if (!supabase) throw new Error('Supabase no disponible');

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const supabase = ensureSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
}

export async function getSession() {
    const supabase = ensureSupabase();
    if (!supabase) return null;

    const { data } = await supabase.auth.getSession();
    return data.session;
}

export async function getUser() {
    const supabase = ensureSupabase();
    if (!supabase) return null;

    const { data } = await supabase.auth.getUser();
    return data.user;
}

export async function resetPassword(email) {
    const supabase = ensureSupabase();
    if (!supabase) throw new Error('Supabase no disponible');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/login'
    });
    if (error) throw error;
}

export async function updatePassword(newPassword) {
    const supabase = ensureSupabase();
    if (!supabase) throw new Error('Supabase no disponible');

    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
}

export function onAuthStateChange(callback) {
    const supabase = ensureSupabase();
    if (!supabase) {
        console.warn('Supabase no disponible para listener de auth');
        return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
}

// Obtener el perfil del usuario desde la tabla profiles
export async function getProfile(userId) {
    const supabase = ensureSupabase();
    if (!supabase || !userId) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error al cargar perfil:', error);
        return null;
    }
    return data;
}

// Actualizar perfil del usuario
export async function updateProfile(userId, updates) {
    const supabase = ensureSupabase();
    if (!supabase || !userId) return null;

    const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data;
}
