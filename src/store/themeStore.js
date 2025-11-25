import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useThemeStore = create(
    persist(
        (set) => ({
            themeMode: 'system', // 'system' | 'light' | 'dark'
            setThemeMode: (mode) => set({ themeMode: mode }),
        }),
        {
            name: 'gymdesk-theme',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
