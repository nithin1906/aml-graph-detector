import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, User, Activity, RefreshCw, Shield, Clock, ThumbsUp, ThumbsDown, Info } from 'lucide-react';

const TransactionList = ({ suspiciousNodes, onRegenerate, onAnalyze, isAnalyzing, stats }) => {

    const handleFeedback = async (nodeId, action) => {
        try {
            // Extract clean ID
            const rawId = typeof nodeId === 'object' ? nodeId.id : String(nodeId);
            // Handle potentially complex ID strings like 'User "ACCOUNT"' -> ACCOUNT
            let cleanId = rawId;
            if (rawId.includes(':')) {
                cleanId = rawId.split(':')[1].replace(/["{}]/g, '').trim();
            } else {
                cleanId = rawId.replace(/["{}]/g, '').trim();
            }

            console.log(`Sending feedback for ${cleanId}: ${action}`);

            const response = await fetch('http://localhost:8000/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account_id: cleanId, action })
            });

            if (response.ok) {
                // minimal feedback to user
                const btn = document.activeElement;
                if (btn) {
                    btn.style.color = action === 'mark_safe' ? '#4ade80' : '#f87171';
                    setTimeout(() => onAnalyze?.(), 1000); // Re-run analysis to reflect changes (remove safe node)
                }
            } else {
                console.error("Feedback failed");
            }
        } catch (err) {
            console.error("Error sending feedback:", err);
        }
    };

    return (
        <motion.div
            className="border border-[var(--border-color)] dark:border-gray-800 rounded-2xl p-6 flex flex-col h-full max-h-[600px]"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <Shield size={24} className="text-purple-400" />
                    Suspicious Accounts
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Flagged transactions and accounts</p>
            </div>

            {/* Detection Status */}
            <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <AnimatePresence mode="wait">
                    {suspiciousNodes.length === 0 ? (
                        <motion.div
                            key="clear"
                            className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <CheckCircle size={20} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-green-400">All Clear</p>
                                <p className="text-xs text-gray-400">No suspicious activity</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="alert"
                            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <motion.div
                                className="p-2 bg-red-500/20 rounded-lg"
                                animate={{
                                    scale: [1, 1.1, 1],
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <AlertTriangle size={20} className="text-red-400" />
                            </motion.div>
                            <div>
                                <p className="text-sm font-bold text-red-400">Alert Detected</p>
                                <p className="text-xs text-gray-400">
                                    {suspiciousNodes.length} suspicious account{suspiciousNodes.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Suspicious Activity List (Flattened) */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        Detected Alerts
                    </h4>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    <AnimatePresence>
                        {suspiciousNodes.length === 0 ? (
                            <motion.div
                                key="empty"
                                className="flex flex-col items-center justify-center h-full text-gray-500 py-8"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Activity size={32} className="text-gray-600 mb-3" />
                                <p className="text-sm font-medium text-center">Run analysis to detect suspicious patterns</p>
                            </motion.div>
                        ) : (
                            // We will map over the accounts but if an account has multiple reasons, we can split them visually
                            suspiciousNodes.flatMap((node, idx) => {
                                const id = typeof node === 'object' ? node.id : node;
                                const reasons = typeof node === 'object' && node.reason ? node.reason.split(';') : ["Unusual activity detected"];

                                return reasons.map((reason, reasonIdx) => (
                                    <motion.div
                                        key={`${id}-${reasonIdx}`}
                                        className="group bg-gray-900/50 border border-red-500/20 hover:border-red-500/50 rounded-xl p-4 transition-all"
                                        initial={{ opacity: 0, x: 30, scale: 0.9 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        transition={{
                                            duration: 0.4,
                                            delay: (idx * reasons.length + reasonIdx) * 0.05,
                                        }}
                                        whileHover={{
                                            scale: 1.02,
                                            borderColor: 'rgba(239, 68, 68, 0.6)'
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-red-500/20 rounded-lg flex-shrink-0">
                                                <Activity size={18} className="text-red-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${reason.toLowerCase().includes('smurfing') ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                        reason.toLowerCase().includes('layering') ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                                            'bg-red-500/20 text-red-400 border-red-500/30'
                                                        }`}>
                                                        {reason.split('(')[0].trim()}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500"><Clock size={10} className="inline mr-1" />Now</span>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                                        {reason.trim()}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        Account: <span className="font-mono text-gray-300">{id.replace ? id.replace(/["{}]/g, '').split(':')[1] || id : id}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Minimal Action Buttons */}
                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleFeedback(node, 'mark_safe')} title="Mark Safe" className="text-gray-500 hover:text-green-400"><ThumbsUp size={14} /></button>
                                                <button onClick={() => handleFeedback(node, 'confirm_fraud')} title="Confirm" className="text-gray-500 hover:text-red-400"><ThumbsDown size={14} /></button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ));
                            })
                        )}
                    </AnimatePresence>
                </div>

                {/* Guidance / Pro-Tip */}
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-start gap-2">
                        <div className="p-1 bg-blue-500/20 rounded-full mt-0.5">
                            <Info size={14} className="text-blue-400" />
                        </div>
                        <div>
                            <h5 className="text-xs font-bold text-blue-400 mb-1">Recommended Actions</h5>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                • Review flagged transactions for structuring.<br />
                                • Use <b>Mark Safe</b> <ThumbsUp size={10} className="inline" /> if known entity.<br />
                                • Use <b>Confirm</b> <ThumbsDown size={10} className="inline" /> to train model.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div >
    );
};

export default TransactionList;
