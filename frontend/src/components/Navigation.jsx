import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Network, LayoutDashboard, Info, LogOut, Upload } from 'lucide-react';

const Navigation = ({ isOpen = false, onClose = () => { } }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/about', label: 'About', icon: Info },
    ];

    return (
        <motion.aside
            className={`w-72 border-r border-[var(--border-color)] dark:border-gray-800 flex flex-col h-screen z-40 transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative`}
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Logo Section */}
            <div className="p-6 border-b border-[var(--border-color)] dark:border-gray-800 flex-shrink-0">
                <Link to="/" className="flex items-center gap-3 group">
                    <motion.div
                        className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl"
                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.3 }}
                    >
                        <Network size={24} className="text-white" />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">AML Detector</h1>
                        <p className="text-xs text-gray-400">Money Laundering Detection</p>
                    </div>
                </Link>
            </div>

            {/* Navigation Items */}
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                <div className="mb-6">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 px-3">GENERAL</p>
                    {navItems.map(({ path, label, icon: Icon }) => {
                        const isActive = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-2 transition-all ${isActive
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Section */}
            <div className="mt-auto p-4 border-t border-gray-800 flex-shrink-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="bg-gradient-to-r from-green-700/10 to-emerald-700/10 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-400 mb-2">SYSTEM STATUS</p>
                    <p className="text-lg font-bold text-green-400">Operational</p>
                </div>
                <button className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 dark:text-gray-200 bg-transparent hover:text-[var(--text-primary)] hover:bg-gray-200/50 dark:hover:bg-gray-800/40 transition-all w-full justify-center border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                    <LogOut size={20} />
                    <span className="font-medium">Log out</span>
                </button>
            </div>
        </motion.aside>
    );
};

export default Navigation;
