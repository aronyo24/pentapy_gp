import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { ensureCsrfCookie, fetchDashboard, logoutUser } from "@/api/auth";
import type { AuthUser } from "@/types/interface";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    const primeCsrf = async () => {
      try {
        await ensureCsrfCookie();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug("CSRF prefetch failed", error);
        }
      } finally {
        setInitialised(true);
      }
    };

    void primeCsrf();
  }, []);

  const {
    data: user,
    isFetching,
    refetch,
    status,
  } = useQuery<AuthUser | null>({
    queryKey: ["auth", "me"],
    queryFn: fetchDashboard,
    enabled: initialised,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 0,
  });

  const refresh = useCallback(async () => {
    const result = await refetch();
    return result.data ?? null;
  }, [refetch]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      await queryClient.cancelQueries({ queryKey: ["auth", "me"] });
      queryClient.setQueryData<AuthUser | null>(["auth", "me"], null);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/login", { replace: true });
    }
  }, [navigate, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      loading: status === "pending" || !initialised,
      refreshing: isFetching,
      refresh,
      logout,
    }),
    [user, status, initialised, isFetching, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
