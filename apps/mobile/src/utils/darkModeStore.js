import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_MODE_KEY = '@physics_tutor_dark_mode';

export const useDarkModeStore = create((set, get) => ({
  isDark: Appearance.getColorScheme() === 'dark',
  isManual: false,
  
  init: async () => {
    try {
      const saved = await AsyncStorage.getItem(DARK_MODE_KEY);
      if (saved !== null) {
        const { isDark, isManual } = JSON.parse(saved);
        set({ isDark, isManual });
      } else {
        // Use system preference
        const systemIsDark = Appearance.getColorScheme() === 'dark';
        set({ isDark: systemIsDark, isManual: false });
      }
    } catch (error) {
      console.error('Error loading dark mode:', error);
    }
  },
  
  toggle: async () => {
    const { isDark } = get();
    const newIsDark = !isDark;
    set({ isDark: newIsDark, isManual: true });
    try {
      await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify({ isDark: newIsDark, isManual: true }));
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  },
  
  setDark: async (value) => {
    set({ isDark: value, isManual: true });
    try {
      await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify({ isDark: value, isManual: true }));
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  },
}));

// Listen to system changes if not manual
Appearance.addChangeListener(({ colorScheme }) => {
  const { isManual } = useDarkModeStore.getState();
  if (!isManual) {
    useDarkModeStore.setState({ isDark: colorScheme === 'dark' });
  }
});
