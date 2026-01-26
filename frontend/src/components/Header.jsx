import React from 'react';
import { Menu, SunMoon, Search, Bell, Play, Repeat } from 'lucide-react';

const Header = ({ onToggleSidebar, onToggleTheme, theme }) => {
  const dispatchAction = (name) => {
    window.dispatchEvent(new CustomEvent(name));
  };

  return (
    <header className="w-full flex items-center justify-between gap-4 py-3 px-4 bg-transparent border-b border-[var(--border-color)] dark:border-gray-800 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle menu"
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800/40 transition-all md:hidden"
          onClick={onToggleSidebar}
          data-tooltip="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="relative hidden sm:flex items-center bg-transparent border-b border-gray-300 dark:border-transparent dark:bg-slate-900/40 dark:rounded-md px-3 py-1 focus-within:border-blue-500 shadow-none dark:shadow-none">
          <Search size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
          <input
            placeholder="Search accounts, transactions..."
            className="bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder-gray-500 w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="btn-secondary flex items-center gap-2"
          onClick={() => dispatchAction('run-analysis')}
          data-tooltip="Run global analysis"
        >
          <Play size={16} />
          <span className="hidden md:inline">Run Analysis</span>
        </button>





        <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800/40 transition-all text-[var(--text-primary)]" data-tooltip="Notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
