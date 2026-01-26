import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Zap, Users, Code, Database, Brain, Network, Rocket, TrendingUp, Cpu, Globe, Lock, Sparkles } from 'lucide-react';

const AboutUs = () => {
    const features = [
        {
            icon: Brain,
            title: 'AI-Powered Detection',
            description: 'Advanced Graph Neural Networks identify complex money laundering patterns',
            gradient: 'from-purple-500/20 to-pink-500/20',
            iconGradient: 'from-purple-500 to-pink-500'
        },
        {
            icon: Network,
            title: 'Graph Analysis',
            description: 'Visualize and analyze transaction networks in real-time',
            gradient: 'from-blue-500/20 to-cyan-500/20',
            iconGradient: 'from-blue-500 to-cyan-500'
        },
        {
            icon: Shield,
            title: 'Risk Assessment',
            description: 'Automated risk scoring and suspicious activity flagging',
            gradient: 'from-green-500/20 to-emerald-500/20',
            iconGradient: 'from-green-500 to-emerald-500'
        },
        {
            icon: Zap,
            title: 'Real-time Processing',
            description: 'Instant analysis of transaction graphs with sub-second response times',
            gradient: 'from-orange-500/20 to-yellow-500/20',
            iconGradient: 'from-orange-500 to-yellow-500'
        }
    ];

    const technologies = [
        { name: 'PyTorch Geometric', category: 'ML Framework', icon: Brain, color: 'purple' },
        { name: 'FastAPI', category: 'Backend', icon: Code, color: 'green' },
        { name: 'React', category: 'Frontend', icon: Code, color: 'blue' },
        { name: 'Cytoscape.js', category: 'Visualization', icon: Network, color: 'cyan' },
        { name: 'NetworkX', category: 'Graph Analysis', icon: Database, color: 'indigo' },
    ];

    const roadmapItems = [
        {
            phase: 'Phase 1',
            title: 'Enhanced Detection Algorithms',
            status: 'In Progress',
            items: [
                'Advanced GNN architectures (GraphSAGE, GAT)',
                'Multi-pattern detection (layering, structuring)',
                'Temporal analysis for time-series patterns',
                'Anomaly scoring improvements'
            ],
            icon: Brain,
            color: 'blue'
        },
        {
            phase: 'Phase 2',
            title: 'Scalability & Performance',
            status: 'Planned',
            items: [
                'Distributed graph processing',
                'Real-time streaming analytics',
                'GPU-accelerated inference',
                'Horizontal scaling architecture'
            ],
            icon: Zap,
            color: 'purple'
        },
        {
            phase: 'Phase 3',
            title: 'Enterprise Features',
            status: 'Planned',
            items: [
                'Multi-tenant support',
                'Role-based access control',
                'Audit logging and compliance',
                'Custom rule engine'
            ],
            icon: Lock,
            color: 'green'
        },
        {
            phase: 'Phase 4',
            title: 'Advanced Analytics',
            status: 'Research',
            items: [
                'Explainable AI for predictions',
                'Interactive graph exploration',
                'Automated report generation',
                'Integration with external data sources'
            ],
            icon: Sparkles,
            color: 'orange'
        }
    ];

    const futureTechnologies = [
        {
            name: 'GraphSAGE & GAT',
            description: 'Advanced graph neural network architectures for improved pattern recognition',
            icon: Cpu,
            category: 'Machine Learning',
            gradient: 'from-purple-500/20 to-pink-500/20'
        },
        {
            name: 'Apache Kafka',
            description: 'Real-time data streaming for continuous transaction monitoring',
            icon: Database,
            category: 'Data Pipeline',
            gradient: 'from-blue-500/20 to-cyan-500/20'
        },
        {
            name: 'Kubernetes',
            description: 'Container orchestration for scalable, cloud-native deployment',
            icon: Globe,
            category: 'Infrastructure',
            gradient: 'from-green-500/20 to-emerald-500/20'
        },
        {
            name: 'TensorRT',
            description: 'GPU-accelerated inference for high-performance predictions',
            icon: Zap,
            category: 'Performance',
            gradient: 'from-orange-500/20 to-yellow-500/20'
        }
    ];

    const getStatusColor = (status) => {
        const colors = {
            'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'Planned': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'Research': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
        };
        return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    const getPhaseColor = (color) => {
        const colors = {
            blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
            purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
            green: 'from-green-500/20 to-green-600/20 border-green-500/30',
            orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30'
        };
        return colors[color] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                type: "spring",
                stiffness: 100
            }
        }
    };

    return (
        <motion.div
            className="flex-1 overflow-y-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 space-y-12 sm:space-y-16 lg:space-y-20">
                {/* Hero Section */}
                <motion.div
                    className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-6"
                    variants={itemVariants}
                >
                    <motion.div
                        className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 sm:mb-8 shadow-2xl"
                        whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.5 }}
                    >
                        <Shield size={48} className="text-white sm:w-16 sm:h-16" />
                    </motion.div>
                    <motion.h1
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 break-words px-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="gradient-text">AML Graph Detector</span>
                    </motion.h1>
                    <motion.p
                        className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 sm:mb-8 font-medium break-words px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        Advanced Anti-Money Laundering Detection System
                    </motion.p>
                    <motion.p
                        className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-3xl mx-auto break-words px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        A cutting-edge proof-of-concept application that leverages Graph Neural Networks
                        to detect sophisticated money laundering patterns, specifically targeting circular
                        trading schemes in financial transaction networks.
                    </motion.p>
                </motion.div>

                {/* Mission Section */}
                <motion.div
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-12"
                    variants={itemVariants}
                >
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <motion.div
                            className="p-4 sm:p-5 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl flex-shrink-0"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Target size={28} className="text-blue-400 sm:w-8 sm:h-8" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 break-words">Our Mission</h2>
                            <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-4 sm:mb-6 break-words">
                                To revolutionize financial crime detection through advanced AI and graph analytics
                            </p>
                            <p className="text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed break-words">
                                Financial institutions face an ever-growing challenge in detecting money laundering activities.
                                Traditional rule-based systems often fail to identify complex, evolving patterns. Our solution
                                combines the power of Graph Neural Networks with intuitive visualization to provide analysts
                                with unprecedented insights into suspicious transaction networks.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Key Features */}
                <motion.div
                    variants={itemVariants}
                >
                    <motion.h2
                        className="text-4xl font-bold text-white mb-12 flex items-center gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Zap size={40} className="text-purple-400" />
                        Key Features
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={index}
                                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 min-w-0"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{
                                        y: -4,
                                        transition: { duration: 0.2 }
                                    }}
                                >
                                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                                        <motion.div
                                            className={`p-4 sm:p-5 bg-gradient-to-br ${feature.iconGradient} rounded-xl shadow-lg flex-shrink-0`}
                                            whileHover={{ rotate: 360, scale: 1.1 }}
                                            transition={{ duration: 0.6 }}
                                        >
                                            <Icon size={28} className="text-white sm:w-8 sm:h-8" />
                                        </motion.div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 break-words">{feature.title}</h3>
                                            <p className="text-sm sm:text-base text-gray-400 leading-relaxed break-words">{feature.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Technology Stack */}
                <motion.div
                    variants={itemVariants}
                >
                    <motion.h2
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8 sm:mb-12 flex items-center gap-3 sm:gap-4 flex-wrap"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Code size={32} className="text-green-400 sm:w-10 sm:h-10 flex-shrink-0" />
                        <span className="break-words">Technology Stack</span>
                    </motion.h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
                        {technologies.map((tech, index) => {
                            const Icon = tech.icon;
                            return (
                                <motion.div
                                    key={index}
                                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 text-center hover:bg-white/10 transition-all duration-300 min-w-0"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{
                                        y: -4,
                                        transition: { duration: 0.2 }
                                    }}
                                >
                                    <motion.div
                                        className={`inline-flex p-3 sm:p-4 bg-gradient-to-br from-${tech.color}-500/30 to-${tech.color}-600/30 rounded-xl mb-3 sm:mb-4`}
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <Icon size={24} className={`text-${tech.color}-400 sm:w-8 sm:h-8`} />
                                    </motion.div>
                                    <h3 className="text-sm sm:text-base font-bold text-white mb-1 sm:mb-2 break-words">{tech.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium truncate">{tech.category}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Team Section - Single Developer */}
                <motion.div
                    variants={itemVariants}
                    className="space-y-6 sm:space-y-8"
                >
                    <motion.h2
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-3 sm:gap-4 flex-wrap"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Users size={32} className="text-purple-400 sm:w-10 sm:h-10 flex-shrink-0" />
                        <span className="break-words">Developer</span>
                    </motion.h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* Developer Card - Compact */}
                        <motion.div
                            className="bg-gradient-to-br from-blue-500/15 to-purple-500/15 border-2 border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-xl min-w-0"
                            whileHover={{ scale: 1.02, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                            transition={{ duration: 0.3 }}
                        >
                            <motion.div
                                className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
                                animate={{
                                    scale: [1, 1.08, 1],
                                    boxShadow: [
                                        '0 0 0px rgba(59, 130, 246, 0)',
                                        '0 0 30px rgba(59, 130, 246, 0.6)',
                                        '0 0 0px rgba(59, 130, 246, 0)'
                                    ]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <span className="text-3xl sm:text-5xl font-extrabold text-white">N</span>
                            </motion.div>
                            <motion.h3
                                className="text-xl sm:text-2xl font-extrabold mb-2 text-center break-words"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <span className="gradient-text">Nithin N</span>
                            </motion.h3>
                            <motion.p
                                className="text-base sm:text-lg text-blue-400 font-bold mb-3 sm:mb-4 text-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                Full Stack Developer
                            </motion.p>
                            <motion.p
                                className="text-xs sm:text-sm text-gray-400 leading-relaxed text-center break-words"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                AI/ML specialist architecting advanced AML detection systems using Graph Neural Networks and real-time analytics.
                            </motion.p>
                        </motion.div>

                        {/* Skills & Expertise - Adjacent Cards */}
                        <motion.div
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 min-w-0"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        >
                            <motion.div
                                className="p-3 sm:p-4 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl mb-3 sm:mb-4 inline-block"
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                            >
                                <Brain size={20} className="text-purple-400 sm:w-6 sm:h-6" />
                            </motion.div>
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 break-words">Machine Learning</h3>
                            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed break-words">
                                Advanced GNN architectures, PyTorch Geometric, graph analytics, pattern recognition, and AI-driven fraud detection.
                            </p>
                        </motion.div>

                        <motion.div
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 min-w-0"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        >
                            <motion.div
                                className="p-3 sm:p-4 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-xl mb-3 sm:mb-4 inline-block"
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                            >
                                <Code size={20} className="text-blue-400 sm:w-6 sm:h-6" />
                            </motion.div>
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 break-words">Full Stack</h3>
                            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed break-words">
                                FastAPI backend, React frontend, real-time visualization, responsive UI/UX, and cloud-ready architecture.
                            </p>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Future Developments Section */}
                <motion.div
                    variants={itemVariants}
                    className="pt-8 sm:pt-12 border-t border-white/10"
                >
                    <motion.div
                        className="text-center max-w-4xl mx-auto mb-12 sm:mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <motion.div
                            className="inline-flex p-4 sm:p-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mb-6 sm:mb-8 shadow-2xl"
                            whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.5 }}
                        >
                            <Rocket size={48} className="text-white sm:w-16 sm:h-16" />
                        </motion.div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6">
                            <span className="gradient-text">Future Developments</span>
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-300 mb-3 sm:mb-4 font-medium break-words px-4">
                            Roadmap to Next-Generation AML Detection
                        </p>
                        <p className="text-base sm:text-lg text-gray-400 leading-relaxed break-words px-4">
                            Our vision extends beyond current capabilities. We're building a comprehensive,
                            enterprise-grade platform that will redefine how financial institutions detect
                            and prevent money laundering.
                        </p>
                    </motion.div>

                    {/* Vision Statement */}
                    <motion.div
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-12 mb-12 sm:mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
                            <motion.div
                                className="p-4 sm:p-5 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl flex-shrink-0"
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                            >
                                <TrendingUp size={28} className="text-purple-400 sm:w-8 sm:h-8" />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 break-words">Our Vision</h3>
                                <p className="text-lg sm:text-xl text-gray-400 mb-3 sm:mb-4 break-words">
                                    Building the most advanced AI-powered AML detection platform
                                </p>
                                <p className="text-base sm:text-lg text-gray-300 leading-relaxed break-words">
                                    We envision a future where financial crime detection is proactive, not reactive.
                                    By combining cutting-edge AI, real-time analytics, and intuitive visualization,
                                    we're creating a platform that empowers compliance teams to stay ahead of
                                    sophisticated money laundering schemes.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Development Roadmap */}
                    <motion.div
                        className="mb-12 sm:mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8 sm:mb-12 flex items-center gap-3 sm:gap-4 flex-wrap">
                            <Rocket size={32} className="text-blue-400 sm:w-10 sm:h-10 flex-shrink-0" />
                            <span className="break-words">Development Roadmap</span>
                        </h3>
                        <div className="space-y-4 sm:space-y-6">
                            {roadmapItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <motion.div
                                        key={index}
                                        className={`bg-gradient-to-br ${getPhaseColor(item.color)} border-2 border-white/10 rounded-2xl p-6 sm:p-8 hover:border-opacity-50 transition-all`}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{
                                            y: -4,
                                            transition: { duration: 0.2 }
                                        }}
                                    >
                                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 sm:mb-6">
                                            <div className="flex items-start gap-4 sm:gap-6 min-w-0 flex-1">
                                                <motion.div
                                                    className="p-3 sm:p-4 bg-slate-900/50 rounded-xl flex-shrink-0"
                                                    whileHover={{ rotate: 360, scale: 1.1 }}
                                                    transition={{ duration: 0.6 }}
                                                >
                                                    <Icon size={24} className={`text-${item.color}-400 sm:w-8 sm:h-8`} />
                                                </motion.div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                                                        <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-white break-words">{item.title}</h4>
                                                        <motion.span
                                                            className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold border ${getStatusColor(item.status)} whitespace-nowrap self-start`}
                                                            animate={{
                                                                boxShadow: [
                                                                    '0 0 0px rgba(59, 130, 246, 0)',
                                                                    '0 0 10px rgba(59, 130, 246, 0.5)',
                                                                    '0 0 0px rgba(59, 130, 246, 0)'
                                                                ]
                                                            }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                        >
                                                            {item.status}
                                                        </motion.span>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-gray-400 font-semibold">{item.phase}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                            {item.items.map((feature, idx) => (
                                                <motion.li
                                                    key={idx}
                                                    className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-gray-300 bg-white/5 p-3 sm:p-4 rounded-xl"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.1 + idx * 0.05 }}
                                                    whileHover={{ scale: 1.02, x: 5 }}
                                                >
                                                    <span className="text-blue-400 mt-1 text-base sm:text-lg flex-shrink-0">•</span>
                                                    <span className="font-medium break-words">{feature}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Upcoming Technologies */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8 sm:mb-12 flex items-center gap-3 sm:gap-4 flex-wrap">
                            <Cpu size={32} className="text-green-400 sm:w-10 sm:h-10 flex-shrink-0" />
                            <span className="break-words">Upcoming Technologies</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            {futureTechnologies.map((tech, index) => {
                                const Icon = tech.icon;
                                return (
                                    <motion.div
                                        key={index}
                                        className={`bg-gradient-to-br ${tech.gradient} border-2 border-white/10 rounded-2xl p-6 sm:p-8 hover:border-opacity-50 transition-all min-w-0 overflow-hidden`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{
                                            y: -4,
                                            transition: { duration: 0.2 }
                                        }}
                                    >
                                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                                            <motion.div
                                                className="p-4 sm:p-5 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-xl shadow-lg flex-shrink-0"
                                                whileHover={{ rotate: 360, scale: 1.1 }}
                                                transition={{ duration: 0.6 }}
                                            >
                                                <Icon size={28} className="text-green-400 sm:w-8 sm:h-8" />
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                                    <h4 className="text-lg sm:text-xl font-bold text-white break-words">{tech.name}</h4>
                                                    <motion.span
                                                        className="px-2 sm:px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30 whitespace-nowrap self-start"
                                                        whileHover={{ scale: 1.1 }}
                                                    >
                                                        {tech.category}
                                                    </motion.span>
                                                </div>
                                                <p className="text-sm sm:text-base text-gray-400 leading-relaxed break-words">{tech.description}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AboutUs;
