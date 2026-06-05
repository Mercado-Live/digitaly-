import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase.config';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function initSupabase() {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: AsyncStorage,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return supabaseInstance;
}

export function getSupabase() {
  if (!supabaseInstance) {
    throw new Error(
      'Supabase no inicializado. Ejecuta initSupabase() primero.'
    );
  }
  return supabaseInstance;
}

export async function signInAnonymously(): Promise<string> {
  const supabase = getSupabase();

  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    return session.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw new Error('No se pudo autenticar: ' + error.message);
  }

  if (!data.user) {
    throw new Error('No se recibio usuario anonimo');
  }

  return data.user.id;
}
