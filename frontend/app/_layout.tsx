import { useEffect, useRef, useState } from "react";
import { Stack, router, usePathname } from "expo-router";
import { isAxiosError } from "axios";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  SessionContext,
  SessionStatus,
} from "../contexts/sessionContext";
import { getMyAccount } from "../services/authService";
import { getToken, logout } from "../services/storage";

interface SessionSnapshot {
  token: string | null;
  authenticated: boolean | null;
}

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  );
}

function isAuthenticationEntryPath(pathname: string) {
  return pathname === "/" || pathname === "/login" || pathname === "/register";
}

export default function RootLayout() {
  const pathname = usePathname();
  const [status, setStatus] = useState<SessionStatus>("checking");
  const [retryCount, setRetryCount] = useState(0);
  const sessionSnapshot = useRef<SessionSnapshot>({
    token: null,
    authenticated: null,
  });

  useEffect(() => {
    let active = true;

    async function validateSession() {
      try {
        const token = await getToken();
        if (!active) return;

        const cached = sessionSnapshot.current;
        if (cached.token === token && cached.authenticated !== null) {
          setStatus(cached.authenticated ? "authenticated" : "unauthenticated");
          if (!token && !isPublicPath(pathname)) {
            router.replace("/login");
          } else if (token && isAuthenticationEntryPath(pathname)) {
            router.replace("/feed");
          }
          return;
        }

        setStatus("checking");
        if (!token) {
          await logout();
          if (!active) return;
          sessionSnapshot.current = { token: null, authenticated: false };
          setStatus("unauthenticated");
          if (!isPublicPath(pathname)) router.replace("/login");
          return;
        }

        try {
          await getMyAccount();
          if (!active) return;
          sessionSnapshot.current = { token, authenticated: true };
          setStatus("authenticated");
          if (isAuthenticationEntryPath(pathname)) {
            router.replace("/feed");
          }
        } catch (error: unknown) {
          if (isAxiosError(error) && error.response?.status === 401) {
            await logout();
            if (!active) return;
            sessionSnapshot.current = { token: null, authenticated: false };
            setStatus("unauthenticated");
            router.replace("/login");
            return;
          }

          throw error;
        }
      } catch (error: unknown) {
        console.error("Não foi possível verificar a sessão:", error);
        if (active) {
          setStatus("error");
        }
      }
    }

    void validateSession();
    return () => {
      active = false;
    };
  }, [pathname, retryCount]);

  async function endSession() {
    await logout();
    sessionSnapshot.current = { token: null, authenticated: false };
    setStatus("unauthenticated");
    router.replace("/login");
  }

  return (
    <SafeAreaProvider>
      <SessionContext.Provider
        value={{
          status,
          retry: () => setRetryCount((current) => current + 1),
          endSession,
        }}
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(main)" />
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
        </Stack>
      </SessionContext.Provider>
    </SafeAreaProvider>
  );
}
