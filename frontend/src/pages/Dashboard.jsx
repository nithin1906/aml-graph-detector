import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import GraphView from '../components/GraphView';
import TransactionList from '../components/TransactionList';
import UploadModal from '../components/UploadModal';
import { Activity, Network, TrendingUp, AlertTriangle, Shield, Users, DollarSign, BarChart3, Upload, Filter, X, SlidersHorizontal } from 'lucide-react';
import api from '../config/api';
import { useSearchParams } from 'react-router-dom';

const Dashboard = ({ onCloseSidebar = () => { } }) => {
    const [graphData, setGraphData] = useState(null);
    const [suspiciousNodes, setSuspiciousNodes] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ nodes: 0, edges: 0, suspicious: 0, riskScore: 0 });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filterAmount, setFilterAmount] = useState(0);
    const [showHighRiskOnly, setShowHighRiskOnly] = useState(false);
    const [searchParams] = useSearchParams();

    // Check if we're viewing uploaded statement data
    const uploadId = searchParams.get('upload_id');
    const analysisId = searchParams.get('analysis_id');

    // Filter Logic
    const filteredGraphData = React.useMemo(() => {
        if (!graphData) return null;

        let { nodes, edges } = graphData.elements;

        // Filter by High Risk
        if (showHighRiskOnly) {
            nodes = nodes.filter(n => n.data.suspicious === "true");
            // Keep edges only between visible nodes
            const nodeIds = new Set(nodes.map(n => n.data.id));
            edges = edges.filter(e => nodeIds.has(e.data.source) && nodeIds.has(e.data.target));
        }

        // Filter by Amount (if edge has amount)
        if (filterAmount > 0) {
            edges = edges.filter(e => {
                const amt = parseFloat(e.data.amount || 0);
                return amt >= filterAmount;
            });
            // Remove nodes with no edges if we strictly filter? Maybe not, isolated nodes might be useful. 
            // But let's keep nodes for now to avoid confusion.
        }

        return {
            elements: { nodes, edges }
        };
    }, [graphData, showHighRiskOnly, filterAmount]);

    // Define the callback at the top level to avoid hooks violation
    const handleNodeClick = useCallback((data) => {
        console.log("Node clicked:", data);
    }, []);

    const fetchGraph = async () => {
        try {
            setIsLoading(true);

            // 1. Try to fetch whatever state the backend has
            // The backend endpoint '/api/graph' returns the current in-memory graph
            // independent of 'upload_id' query param if we just want "current state"
            console.log('Fetching graph data...' + (uploadId ? ` for upload_id: ${uploadId}` : ' (global state)'));

            // If uploadId is explicitly provided in URL, we might want to use a specific endpoint
            // BUT for persistence, we usually want "what is currently loaded".
            // Let's rely on the global /api/graph endpoint which returns data G
            const response = await axios.get(api.endpoints.graph);

            if (response.data && response.data.elements && response.data.elements.nodes && response.data.elements.nodes.length > 0) {
                setGraphData(response.data);

                // Calculate stats based on the data we got back
                const nodeCount = response.data.elements.nodes.length;
                const edgeCount = response.data.elements.edges.length;

                // Calculate average risk score
                const riskScores = response.data.elements.nodes.map(n => n.data.risk_score || 0);
                const avgRisk = riskScores.length > 0
                    ? (riskScores.reduce((a, b) => a + b, 0) / riskScores.length * 100).toFixed(1)
                    : 0;

                setStats({
                    nodes: nodeCount,
                    edges: edgeCount,
                    suspicious: 0,
                    riskScore: parseFloat(avgRisk)
                });
            } else {
                setGraphData(null);
                setStats({ nodes: 0, edges: 0, suspicious: 0, riskScore: 0 });
            }

        } catch (error) {
            console.error("Error fetching graph data:", error);
            // Don't clear data immediately on error to avoid flashing empty state if it's just a transient network error
            // But if it's a 404 or similar, maybe we should.
            // For now, let's reset if we genuinely can't get data.
            setGraphData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Always try to fetch graph data on mount
        fetchGraph(uploadId);

        // If there's an analysis ID in URL, fetch specific results
        if (analysisId) {
            console.log("Analysis ID found in URL, fetching results...", analysisId);
            fetchAnalysisResults(analysisId);
        } else {
            // If no URL ID but we might have backend data, try to fetch analysis state from backend
            // For now, we rely on graph data containing necessary info or the user re-running analysis
        }
    }, [uploadId, analysisId]); // Re-fetch when IDs change

    const fetchAnalysisResults = async (id) => {
        setIsAnalyzing(true);
        try {
            const response = await axios.get(api.endpoints.analysisResults(id));
            const results = response.data.results;

            // Handle potentially different response structures
            const suspicious = results.suspicious_transactions || [];
            const accounts = results.suspicious_accounts || [];

            // Process Accounts
            const accountAlerts = results.suspicious_accounts?.map(acc => {
                let id = String(acc);
                let reason = "Suspicious Activity Detected";
                if (typeof acc === 'object' && acc !== null) {
                    id = String(acc.account_id || acc.id || acc.account || JSON.stringify(acc));
                    reason = acc.reason || reason;
                }
                return { id, reason, type: 'account' };
            }) || [];

            // Process Transactions
            const txAlerts = results.suspicious_transactions?.map(tx => {
                // If tx is just an ID or object, normalize
                const from = tx.source || tx.from || '?';
                const to = tx.target || tx.to || '?';
                const amt = tx.amount ? `₹${tx.amount.toLocaleString()}` : '';
                return {
                    id: `Txn: ${from} → ${to} ${amt}`,
                    reason: tx.reason || "Suspicious Transaction",
                    type: 'transaction'
                };
            }) || [];

            // Combine unique items
            // We use a Map to dedup by ID just in case
            const combinedMap = new Map();
            [...accountAlerts, ...txAlerts].forEach(item => combinedMap.set(item.id, item));
            const allSuspicious = Array.from(combinedMap.values());

            setSuspiciousNodes(allSuspicious);
            setStats(prev => ({
                ...prev,
                suspicious: allSuspicious.length,
                riskScore: results.overall_risk_score || prev.riskScore
            }));

        } catch (error) {
            console.error("Error fetching analysis results:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Effect to merge suspicious nodes into graph data when either changes
    useEffect(() => {
        if (!graphData || !graphData.elements || !graphData.elements.nodes) return;

        const nodes = graphData.elements.nodes;
        // Create a lookup set for O(1) access
        const suspiciousIds = new Set(suspiciousNodes.map(n => n.id));

        // Check if we need to update to avoid infinite loops
        const needsUpdate = nodes.some(node => {
            const isSuspicious = suspiciousIds.has(String(node.data.id));
            const currentStatus = node.data.suspicious === 'true';
            return isSuspicious !== currentStatus;
        });

        if (needsUpdate) {
            console.log('🔄 Merging analysis results into graph...');
            const newElements = {
                nodes: nodes.map(node => {
                    const isSusp = suspiciousIds.has(String(node.data.id));
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            suspicious: isSusp ? "true" : "false"
                        }
                    };
                }),
                edges: graphData.elements.edges
            };
            setGraphData(prev => ({ ...prev, elements: newElements }));
        }
    }, [suspiciousNodes, graphData]); // Dependencies: updates when suspicious list or graph data changes

    // Listen to header's global actions
    useEffect(() => {
        const onRun = () => handleAnalyze();
        window.addEventListener('run-analysis', onRun);
        return () => {
            window.removeEventListener('run-analysis', onRun);
        };
    }, [uploadId, graphData]); // Add dependencies to ensure correct state is used


    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        console.log('🔍 Analysis started');

        try {
            // Check if we are analyzing an uploaded statement
            if (uploadId) {
                console.log('📄 Analyze uploaded statement:', uploadId);
                // Call the correct endpoint for statement analysis
                const response = await axios.post(api.endpoints.analyzeStatement(uploadId));
                console.log('✅ Statement Analysis Response:', response.data);

                // The structure for statement analysis might be different, let's normalize
                const { suspicious_accounts_count, overall_risk_score, analysis_id } = response.data;

                // If we get an analysis ID back, we should probably fetch the full results to be consistent
                // But for now let's just use what we have to update stats
                setStats(prev => ({
                    ...prev,
                    suspicious: suspicious_accounts_count,
                    riskScore: overall_risk_score
                }));

                // If we got a new analysis ID and it's not in the URL, we might want to update the URL
                // But typically we should just fetch the full results which contains the node list
                if (analysis_id) {
                    await fetchAnalysisResults(analysis_id);
                    return; // fetchAnalysisResults will finish the job
                }

            } else {
                // Default synthetic data analysis
                console.log('📡 Calling API endpoint for Synthetic Data:', api.endpoints.analyze);
                const response = await axios.get(api.endpoints.analyze);
                console.log('✅ API Response:', response.data);
                const { gnn_predictions, rule_based_nodes } = response.data;

                // Combine unique suspicious nodes
                const allSuspicious = [...new Set([...gnn_predictions, ...rule_based_nodes])];
                console.log('🚩 Suspicious nodes found:', allSuspicious);
                setSuspiciousNodes(allSuspicious);
                setStats(prev => ({ ...prev, suspicious: allSuspicious.length }));

                // Update graph data to reflect suspicious nodes
                if (graphData) {
                    console.log('📊 Updating graph with suspicious nodes');
                    const newElements = {
                        nodes: graphData.elements.nodes.map(node => ({
                            ...node,
                            data: {
                                ...node.data,
                                suspicious: allSuspicious.includes(parseInt(node.data.id)) ? "true" : "false"
                            }
                        })),
                        edges: graphData.elements.edges
                    };
                    setGraphData({ elements: newElements });
                }
            }

        } catch (error) {
            console.error("❌ Error analyzing graph:", error.response?.data || error.message);
            console.error("Full error:", error);
        } finally {
            setIsAnalyzing(false);
            console.log('🏁 Analysis complete');
        }
    };



    const statCards = [
        {
            label: 'Total Accounts',
            value: stats.nodes,
            change: '+12%',
            changeType: 'positive',
            icon: Users,
            color: 'blue',
            bgGradient: 'from-blue-500/10 to-cyan-500/10',
            iconBg: 'bg-blue-500/20',
            iconColor: 'text-blue-400'
        },
        {
            label: 'Transactions',
            value: stats.edges,
            change: '+8%',
            changeType: 'positive',
            icon: DollarSign,
            color: 'green',
            bgGradient: 'from-green-500/10 to-emerald-500/10',
            iconBg: 'bg-green-500/20',
            iconColor: 'text-green-400'
        },
        {
            label: 'Suspicious Activity',
            value: stats.suspicious,
            change: stats.suspicious > 0 ? 'Alert' : 'Clear',
            changeType: stats.suspicious > 0 ? 'negative' : 'positive',
            icon: AlertTriangle,
            color: 'red',
            bgGradient: 'from-red-500/10 to-orange-500/10',
            iconBg: 'bg-red-500/20',
            iconColor: 'text-red-400'
        },
        {
            label: 'Risk Score',
            value: `${parseFloat(stats.riskScore).toFixed(2)}%`,
            change: stats.riskScore > 50 ? 'High' : 'Low',
            changeType: stats.riskScore > 50 ? 'negative' : 'positive',
            icon: Shield,
            color: 'purple',
            bgGradient: 'from-purple-500/10 to-pink-500/10',
            iconBg: 'bg-purple-500/20',
            iconColor: 'text-purple-400'
        }
    ];

    return (
        <div className="flex h-full w-full custom-scroll text-primary" style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)'
        }}>
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Stats Section */}
                <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-[var(--border-color)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {statCards.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.label}
                                    className={`bg-gradient-to-br ${stat.bgGradient} border border-gray-800 rounded-xl p-4 sm:p-6 hover:border-gray-700 transition-all min-w-0 shadow-none`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`${stat.iconBg} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
                                            <Icon size={20} className={stat.iconColor} />
                                        </div>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${stat.changeType === 'positive'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {stat.change}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm text-gray-400 mb-2 truncate font-medium">{stat.label}</p>
                                        <p className="text-2xl sm:text-3xl font-bold break-words text-[var(--text-primary)]">{stat.value}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-[1800px] mx-auto space-y-6">
                        {/* Graph Section */}
                        <motion.div
                            className="border border-[var(--border-color)] rounded-2xl p-6"
                            style={{ backgroundColor: 'var(--bg-secondary)' }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 sm:gap-3 flex-wrap text-[var(--text-primary)]">
                                        <BarChart3 size={28} className="text-blue-500 flex-shrink-0" />
                                        <span className="break-words">Transaction Network Analysis</span>
                                    </h2>
                                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 break-words">Visualize and analyze transaction networks in real-time</p>
                                </div>
                                <div className="flex gap-3 flex-wrap">
                                    <motion.button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white text-sm sm:text-base font-semibold hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ripple whitespace-nowrap"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Activity size={18} className={isAnalyzing ? 'animate-spin' : ''} />
                                        {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                                    </motion.button>

                                    {/* Filter Button */}
                                    <div className="relative">
                                        <motion.button
                                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                                            className={`px-4 sm:px-6 py-2 sm:py-3 border rounded-xl text-white text-sm sm:text-base font-semibold transition-all flex items-center gap-2 ripple whitespace-nowrap ${showFilterMenu || showHighRiskOnly || filterAmount > 0
                                                ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20'
                                                : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Filter size={18} />
                                            Filters
                                            {(showHighRiskOnly || filterAmount > 0) && (
                                                <span className="flex h-2 w-2 rounded-full bg-red-400 ml-1"></span>
                                            )}
                                        </motion.button>

                                        {/* Filter Dropdown */}
                                        <AnimatePresence>
                                            {showFilterMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute right-0 top-full mt-2 w-72 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-4 z-50 origin-top-right"
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                            <SlidersHorizontal size={16} className="text-blue-400" />
                                                            Filter View
                                                        </h4>
                                                        <button onClick={() => setShowFilterMenu(false)} className="text-gray-500 hover:text-white">
                                                            <X size={16} />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {/* High Risk Toggle */}
                                                        <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-gray-800">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-gray-200">High Risk Only</span>
                                                                <span className="text-xs text-gray-500">Show only flagged nodes</span>
                                                            </div>
                                                            <button
                                                                onClick={() => setShowHighRiskOnly(!showHighRiskOnly)}
                                                                className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${showHighRiskOnly ? 'bg-red-500' : 'bg-gray-700'}`}
                                                            >
                                                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${showHighRiskOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                                                            </button>
                                                        </div>

                                                        {/* Transaction Amount Slider */}
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-400">Min Transaction</span>
                                                                <span className="text-blue-400 font-mono">₹{filterAmount.toLocaleString()}</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100000"
                                                                step="1000"
                                                                value={filterAmount}
                                                                onChange={(e) => setFilterAmount(Number(e.target.value))}
                                                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                                            />
                                                            <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                                                                <span>₹0</span>
                                                                <span>₹1L+</span>
                                                            </div>
                                                        </div>

                                                        {/* Reset Button */}
                                                        {(showHighRiskOnly || filterAmount > 0) && (
                                                            <button
                                                                onClick={() => {
                                                                    setFilterAmount(0);
                                                                    setShowHighRiskOnly(false);
                                                                }}
                                                                className="w-full py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                                            >
                                                                Reset Filters
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-[var(--border-color)] dark:border-gray-800 relative h-[600px]">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="inline-block mb-4"
                                            >
                                                <Activity size={48} className="text-blue-500" />
                                            </motion.div>
                                            <p className="text-gray-400">Loading network graph...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <GraphView
                                        graphData={filteredGraphData}
                                        onNodeClick={handleNodeClick}
                                    />
                                )}
                            </div>
                        </motion.div>

                        {/* Bottom Section - Transactions and Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Transaction List - Takes 2 columns */}
                            <div className="lg:col-span-2">
                                <TransactionList
                                    suspiciousNodes={suspiciousNodes}
                                    onAnalyze={handleAnalyze}
                                    isAnalyzing={isAnalyzing}
                                    stats={stats}
                                />
                            </div>

                            {/* Quick Stats Panel - Takes 1 column */}
                            <motion.div
                                className="border border-[var(--border-color)] rounded-2xl p-6"
                                style={{ backgroundColor: 'var(--bg-secondary)' }}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                                    <Shield size={24} className="text-purple-400" />
                                    Network Health
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-[var(--border-color)] dark:border-transparent">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Network Density</p>
                                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                                                {stats.nodes > 0 ? ((stats.edges / (stats.nodes * (stats.nodes - 1))) * 100).toFixed(2) : '0.00'}%
                                            </p>
                                        </div>
                                        <Network size={32} className="text-blue-400" />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-[var(--border-color)] dark:border-transparent">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg. Risk Score</p>
                                            <p className="text-2xl font-bold text-[var(--text-primary)]">{parseFloat(stats.riskScore).toFixed(2)}%</p>
                                        </div>
                                        <Shield size={32} className="text-purple-400" />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-[var(--border-color)] dark:border-transparent">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Threat Level</p>
                                            <p className={`text-2xl font-bold ${stats.suspicious > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'
                                                }`}>
                                                {stats.suspicious > 0 ? 'High' : 'Low'}
                                            </p>
                                        </div>
                                        <AlertTriangle size={32} className={
                                            stats.suspicious > 0 ? 'text-red-400' : 'text-green-400'
                                        } />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
            />

            {/* Floating Upload Button */}
            <motion.button
                onClick={() => setShowUploadModal(true)}
                className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all z-40 group"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                <Upload size={28} className="text-white" />
                <motion.div
                    className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    initial={{ opacity: 0, x: 10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                >
                    Upload Statement
                </motion.div>
            </motion.button>
        </div>
    );
};

export default Dashboard;
