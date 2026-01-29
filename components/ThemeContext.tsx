
import React, { createContext, useContext, useEffect } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 强制锁定 Dark Mode
  const theme: Theme = 'dark';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');
    // 清除可能残留的本地存储
    localStorage.setItem('app-theme', 'dark');
  }, []);

  const toggleTheme = () => {
    // 空函数，禁用切换
    console.warn("Light mode is disabled.");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
