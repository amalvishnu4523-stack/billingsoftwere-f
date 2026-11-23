import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { DRAWER_WIDTH, COLLAPSED_WIDTH } from './Sidebar';
import TopBar from './TopBar';
import ErrorBoundary from '../common/ErrorBoundary';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function AppShell() {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSidebarToggle = () => {
    if (isMobile) setMobileOpen((p) => !p);
    else setCollapsed((p) => !p);
  };

  const desktopSidebarWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;
  const sidebarWidth = isMobile ? 0 : desktopSidebarWidth;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar
          open
          onClose={() => {}}
          variant="permanent"
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />
      )}

      {/* Mobile sidebar */}
      {isMobile && (
        <Sidebar
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          variant="temporary"
          collapsed={false}
          onCollapsedChange={() => {}}
        />
      )}

      {/* TopBar */}
      <TopBar onSidebarToggle={handleSidebarToggle} sidebarWidth={sidebarWidth} />

      {/* Main content */}
      <main
        className="flex-1 flex flex-col min-w-0 transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="h-14" /> {/* spacer for fixed TopBar */}
        <div className="flex-1 p-4 sm:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
