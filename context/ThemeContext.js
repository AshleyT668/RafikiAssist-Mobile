import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

const lightTheme = {
  background: '#f6f7f8',
  card: '#ffffff',
  text: '#333333',
  subtext: '#666666',
  primary: '#3da49a',
};

const darkTheme = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  subtext: '#aaaaaa',
  primary: '#2d8a82',
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
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