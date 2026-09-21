import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Profile, Role } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (params: { email: string; password: string; fullName: string; role: Role; coachInviteCode?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      console.warn('Failed to load profile', error.message);
      setProfile(null);
      return;
    }
    setProfile(data as Profile);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp({ email, password, fullName, role, coachInviteCode }) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const userId = data.user?.id;
        if (!userId) throw new Error("La création du compte n'a pas retourné d'utilisateur.");

        let coachId: string | null = null;
        if (role === 'coache' && coachInviteCode) {
          const { data: coachProfile, error: coachError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', coachInviteCode)
            .eq('role', 'coach')
            .single();
          if (coachError || !coachProfile) {
            throw new Error("Code coach invalide. Demandez le code à votre coach.");
          }
          coachId = coachProfile.id;
        }

        const { error: profileError } = await supabase.from('profiles').insert({
          id: userId,
          role,
          full_name: fullName,
          coach_id: coachId,
        });
        if (profileError) throw profileError;
        await loadProfile(userId);
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      async refreshProfile() {
        if (session?.user.id) {
          await loadProfile(session.user.id);
        }
      },
    }),
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
