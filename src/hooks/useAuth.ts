"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useAuth() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUp(name: string, email: string, password: string) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return false;
    }
    router.push("/onboarding");
    return true;
  }

  async function signIn(email: string, password: string) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return false;
    }
    router.push("/dashboard");
    return true;
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  async function resetPassword(email: string) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return false;
    }
    setLoading(false);
    return true;
  }

  async function updatePassword(password: string) {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return false;
    }
    router.push("/dashboard");
    return true;
  }

  return { signUp, signIn, signOut, resetPassword, updatePassword, loading, error, setError };
}
