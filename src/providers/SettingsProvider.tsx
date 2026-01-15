import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { subscribeGlobalSettings } from "../lib/settings";
import { GlobalSettings } from "../types/settings";

type SettingsContextValue = {
  settings: GlobalSettings | null;
  loading: boolean;
  error: string | null;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeGlobalSettings(
      (s) => {
        setSettings(s);
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err.message : "Error leyendo settings");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const value = useMemo(() => ({ settings, loading, error }), [settings, loading, error]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

export function useOptionalSettings() {
  return useContext(SettingsContext);
}