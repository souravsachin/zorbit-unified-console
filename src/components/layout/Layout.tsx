import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { HamburgerMenu } from '../HamburgerMenu';
import Header from './Header';
import { useAuth } from '../../hooks/useAuth';
import { usePreferences } from '../../hooks/usePreferences';

const Layout: React.FC = () => {
  const { user } = useAuth();
  const { prefs, update: updatePrefs } = usePreferences(user?.id);

  // Sidebar drawer open/close (controlled by hamburger button + close gesture)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Locked = sidebar stays open persistently (desktop only)
  const locked = prefs.ui?.sidebar?.pinned ?? false;

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('zorbit_dark') === 'true';
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('zorbit_dark', String(darkMode));
  }, [darkMode]);

  // On desktop + locked, sidebar is always visible regardless of sidebarOpen
  const sidebarVisible = isMobile ? sidebarOpen : locked || sidebarOpen;

  // Show hamburger when sidebar is NOT persistently visible at full width
  const showHamburger = isMobile || !locked;

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <HamburgerMenu
        open={sidebarVisible}
        onClose={closeSidebar}
        isOverlay={isMobile || !locked}
        prefs={prefs}
        updatePrefs={updatePrefs}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuToggle={toggleSidebar}
          darkMode={darkMode}
          onDarkModeToggle={() => setDarkMode(!darkMode)}
          showHamburger={showHamburger}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
