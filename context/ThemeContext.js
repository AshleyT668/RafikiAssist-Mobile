import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'themePreference';

const lightTheme = {
  background: '#f6f7f8',
  card: '#ffffff',
  text: '#333333',
  subtext: '#666666',
  primary: '#3da49a',
  primaryDark: '#37877E',
  primaryLight: '#E6F4F3',
  border: '#D6E8E6',
  shadow: '#2C3E3D',
  overlay: 'rgba(244, 248, 247, 0.72)',
  inputBackground: '#ffffff',
  secondaryCard: '#f0f4f3',
  warning: '#B45309',
  warningBg: '#FFF4E5',
  danger: '#C0544C',
  dangerBg: '#FDF0EF',
  textOnPrimary: '#FFFFFF',
  headerBackground: '#3da49a',
  headerText: '#FFFFFF',
  headerIconBackground: 'rgba(255, 255, 255, 0.18)',
  navBackground: '#ffffff',
  navBorder: '#D6E8E6',
  navIcon: '#333333',
};

const darkTheme = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  subtext: '#aaaaaa',
  primary: '#2d8a82',
  primaryDark: '#236D66',
  primaryLight: '#21413D',
  border: '#334744',
  shadow: '#000000',
  overlay: 'rgba(18, 18, 18, 0.82)',
  inputBackground: '#262626',
  secondaryCard: '#252525',
  warning: '#F5C07A',
  warningBg: '#3B2C16',
  danger: '#F2A7A0',
  dangerBg: '#3C2020',
  textOnPrimary: '#FFFFFF',
  headerBackground: '#1e1e1e',
  headerText: '#ffffff',
  headerIconBackground: '#252525',
  navBackground: '#1e1e1e',
  navBorder: '#334744',
  navIcon: '#ffffff',
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedPreference !== null) {
          setIsDark(storedPreference === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsThemeLoaded(true);
      }
    };

    loadThemePreference();
  }, []);

  const toggleTheme = async () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, isThemeLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
