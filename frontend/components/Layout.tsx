import React from 'react';
import { Bell, Menu, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout = ({ children, title = '8192: Leadership Simulator' }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<number>(3); // Example notification count

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Left section */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">{title}</h1>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none">
                <Bell className="h-6 w-6" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white text-center">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Profile dropdown */}
              <button className="p-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none">
                <User className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out z-20`}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Game Menu</h2>
          </div>

          {/* Sidebar content */}
          <nav className="flex-1 p-4 space-y-2">
            <a href="/" className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              Dashboard
            </a>
            <a href="/game" className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              Play Game
            </a>
            <a href="/leaderboard" className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              Leaderboard
            </a>
            <a href="/profile" className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              Profile
            </a>
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t">
            <div className="text-sm text-gray-500">
              Game Cycle: 1024/8192
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;