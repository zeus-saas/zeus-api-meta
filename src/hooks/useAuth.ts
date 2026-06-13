import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

export type AuthUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  avatar: string | null;
  mfaEnabled: boolean;
  authProvider: string;
  isActive: boolean;
};

export function useAuth() {
  const token = localStorage.getItem("auth_token");
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(
    token ? { token } : undefined,
    {
      enabled: !!token,
      staleTime: 1000 * 60 * 5,
      retry: false,
    }
  );

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("temp_token");
      await utils.invalidate();
      window.location.href = "/login";
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("temp_token");
    logoutMutation.mutate();
    window.location.href = "/login";
  }, [logoutMutation]);

  return useMemo(
    () => ({
      user: user as AuthUser | null,
      isAuthenticated: !!user && !!token,
      isLoading,
      error,
      logout,
      refresh: refetch,
      token,
    }),
    [user, isLoading, error, logout, refetch, token]
  );
}
