// ================================================================
// CARTELERA DIGITAL - api.js
// Capa de abstraccion sobre Supabase: CRUD generico, Storage helpers
// ================================================================

import { ensureSupabase } from './supabase.js';

function supabase() {
    const client = ensureSupabase();
    if (!client) throw new Error('Supabase no inicializado');
    return client;
}

// --- Operaciones CRUD genericas ---

export async function fetchAll(table, options = {}) {
    let query = supabase().from(table).select(options.select || '*', { count: 'exact' });

    if (options.filters) {
        for (const f of options.filters) {
            const [col, op, val] = f;
            query = query[op](col, val);
        }
    }
    if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    if (options.limit != null) {
        const from = options.offset || 0;
        query = query.range(from, from + options.limit - 1);
    }
    if (options.single) {
        query = query.single();
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count };
}

export async function fetchById(table, id, select = '*') {
    const { data, error } = await supabase()
        .from(table)
        .select(select)
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}

export async function create(table, record) {
    const { data, error } = await supabase()
        .from(table)
        .insert(record)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function update(table, id, updates) {
    const { data, error } = await supabase()
        .from(table)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function remove(table, id) {
    const { error } = await supabase()
        .from(table)
        .delete()
        .eq('id', id);
    if (error) throw error;
}

// --- Storage ---

export async function uploadFile(bucket, filePath, file) {
    const { data, error } = await supabase()
        .storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });
    if (error) throw error;
    return data;
}

export async function deleteFile(bucket, filePath) {
    const { data, error } = await supabase()
        .storage
        .from(bucket)
        .remove([filePath]);
    if (error) throw error;
    return data;
}

export function getPublicUrl(bucket, filePath) {
    const { data } = supabase()
        .storage
        .from(bucket)
        .getPublicUrl(filePath);
    return data.publicUrl;
}

// --- Helpers de dispositivos ---

export async function getUserDevices(userId) {
    return fetchAll('devices', {
        filters: [['user_id', 'eq', userId]],
        orderBy: 'created_at',
        ascending: false
    });
}

export async function createDevice(deviceData) {
    const deviceKey = generateDeviceKey();
    return create('devices', {
        ...deviceData,
        device_key: deviceKey,
        status: 'offline',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
}

function generateDeviceKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = '';
    for (let i = 0; i < 6; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

// --- Helpers de media ---

export async function getUserStorageUsage(userId) {
    const { data, error } = await supabase()
        .from('media')
        .select('file_size')
        .eq('user_id', userId)
        .eq('is_archived', false);
    if (error) throw error;
    const totalBytes = (data || []).reduce((sum, item) => sum + (item.file_size || 0), 0);
    return totalBytes;
}

export async function getUserMedia(userId, options = {}) {
    return fetchAll('media', {
        filters: [
            ['user_id', 'eq', userId],
            ['is_archived', 'eq', false]
        ],
        orderBy: 'created_at',
        ascending: false,
        ...options
    });
}

export async function createMedia(mediaData) {
    return create('media', {
        ...mediaData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
}

// --- Helpers de playlists ---

export async function getUserPlaylists(userId) {
    return fetchAll('playlists', {
        filters: [['user_id', 'eq', userId]],
        orderBy: 'updated_at',
        ascending: false
    });
}

// --- Helpers de schedules ---

export async function getUserSchedules(userId) {
    return fetchAll('schedules', {
        filters: [['user_id', 'eq', userId]],
        orderBy: 'created_at',
        ascending: false
    });
}
