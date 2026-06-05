import { useContext, createContext, type ReactNode } from 'react';
import { initSupabase } from '../services/supabase';

type SupabaseClientType = ReturnType<typeof initSupabase>;

const defaultValue: SupabaseClientType | null = null;
const SupabaseContext = createContext(defaultValue);

export function SupabaseProvider({ children }: { readonly children: ReactNode }) {
  const client = initSupabase();
  return (
    <SupabaseContext.Provider value={client}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase(): SupabaseClientType {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error('useSupabase debe usarse dentro de SupabaseProvider');
  }
  return client;
}
