import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Heart } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { icon: Github, href: '#', label: 'GitHub', color: 'hover:text-gray-300' },
        { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:text-blue-400' },
        { icon: Mail, href: '#', label: 'Email', color: 'hover:text-purple-400' },
    ];

    return (
        <motion.footer 
            className="glass-panel mx-4 mb-4 px-6 py-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center justify-between">
                {/* Copyright and Credits */}
                <motion.div 
                    className="flex flex-col gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <p className="text-sm text-gray-400 font-medium">
                        © {currentYear} AML Graph Detector. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        Built with 
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <Heart size={14} className="inline text-red-400" />
                        </motion.span>
                        by the AML Detection Team
                    </p>
                </motion.div>

                {/* Lead Architect */}
                <motion.div 
                    className="flex flex-col items-end gap-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <p className="text-sm font-bold text-gray-300">
                        Lead Architect: <span className="gradient-text">Nithin N</span>
                    </p>
                    <div className="flex gap-4">
                        {socialLinks.map(({ icon: Icon, href, label, color }, index) => (
                            <motion.a
                                key={label}
                                href={href}
                                className={`text-gray-500 ${color} transition-colors p-2 rounded-lg hover:bg-slate-800/50`}
                                aria-label={label}
                                whileHover={{ scale: 1.2, rotate: 360 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Icon size={20} />
                            </motion.a>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.footer>
    );
};

export default Footer;
