import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSettings, saveSettings } from '@/lib/storage';
import { marketRepository } from '@/lib/marketRepository';

interface SettingsState {
  twelveDataKey: string;
  emailTo: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  hydrated: boolean;
  setTwelveDataKey: (key: string) => void;
  setEmailTo: (email: string) => void;
  setEmailEnabled: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
  hydrate: () => void;
  save: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      twelveDataKey: '',
      emailTo: '',
      emailEnabled: false,
      pushEnabled: true,
      hydrated: false,

      setTwelveDataKey: (key) => {
        set({ twelveDataKey: key });
        marketRepository.setTwelveDataApiKey(key || null);
        get().save();
      },

      setEmailTo: (email) => {
        set({ emailTo: email });
        get().save();
      },

      setEmailEnabled: (enabled) => {
        set({ emailEnabled: enabled });
        get().save();
      },

      setPushEnabled: (enabled) => {
        set({ pushEnabled: enabled });
        get().save();
      },

      hydrate: () => {
        const settings = getSettings();
        set({
          twelveDataKey: settings.twelveDataKey,
          emailTo: settings.emailTo,
          emailEnabled: settings.emailEnabled,
          pushEnabled: settings.pushEnabled,
          hydrated: true,
        });
        marketRepository.setTwelveDataApiKey(settings.twelveDataKey || null);
      },

      save: () => {
        const s = get();
        saveSettings({
          twelveDataKey: s.twelveDataKey,
          emailTo: s.emailTo,
          emailEnabled: s.emailEnabled,
          pushEnabled: s.pushEnabled,
        });
      },
    }),
    {
      name: 'ts_settings_zustand',
      skipHydration: true,
    },
  ),
);
