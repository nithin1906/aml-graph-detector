import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UploadModal = ({ isOpen, onClose }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const navigate = useNavigate();

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first");
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:8000/api/upload-statement', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUploadResult(response.data);

            // Automatically start analysis
            setTimeout(() => {
                handleAnalyze(response.data.upload_id);
            }, 1000);

        } catch (err) {
            setError(err.response?.data?.detail || "Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleAnalyze = async (uploadId) => {
        try {
            const response = await axios.post(`http://localhost:8000/api/analyze-statement/${uploadId}`);

            // Close modal and navigate to dashboard with analysis results
            onClose();
            navigate(`/dashboard?analysis_id=${response.data.analysis_id}&upload_id=${uploadId}`);

            // Reload the page to show new data
            window.location.reload();

        } catch (err) {
            setError(err.response?.data?.detail || "Analysis failed. Please try again.");
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleClose = () => {
        setFile(null);
        setUploadResult(null);
        setError(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                >
                    <motion.div
                        className="bg-slate-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-slate-900 border-b border-gray-700 p-6 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Upload Bank Statement</h2>
                                <p className="text-gray-400 text-sm">Upload your statement for AI-powered fraud detection</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Upload Area */}
                            <motion.div
                                className="mb-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <motion.div
                                        animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Upload size={48} className="mx-auto mb-4 text-blue-400" />
                                    </motion.div>
                                    <h3 className="text-lg font-bold text-white mb-2">
                                        Drop your file here or click to browse
                                    </h3>
                                    <p className="text-gray-400 mb-4 text-sm">
                                        Supports CSV, Excel (.xlsx, .xls), and PDF formats
                                    </p>

                                    <input
                                        type="file"
                                        id="file-upload-modal"
                                        className="hidden"
                                        accept=".csv,.xlsx,.xls,.pdf"
                                        onChange={handleFileChange}
                                    />
                                    <label
                                        htmlFor="file-upload-modal"
                                        className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg cursor-pointer transition-all transform hover:scale-105"
                                    >
                                        Select File
                                    </label>
                                </div>

                                {/* Selected File */}
                                {file && (
                                    <motion.div
                                        className="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg flex items-center justify-between"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="text-blue-400" size={24} />
                                            <div>
                                                <p className="text-white font-medium">{file.name}</p>
                                                <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <motion.button
                                            onClick={handleUpload}
                                            disabled={uploading}
                                            className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader className="animate-spin" size={20} />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={20} />
                                                    Upload
                                                </>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4 flex items-start gap-3"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="text-red-400 flex-shrink-0" size={24} />
                                    <div>
                                        <h4 className="text-red-400 font-semibold mb-1">Error</h4>
                                        <p className="text-red-300 text-sm">{error}</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Upload Success */}
                            {uploadResult && (
                                <motion.div
                                    className="bg-green-500/20 border border-green-500/50 rounded-lg p-6"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <CheckCircle className="text-green-400 flex-shrink-0" size={24} />
                                        <div>
                                            <h4 className="text-green-400 font-semibold mb-1">Upload Successful!</h4>
                                            <p className="text-green-300 text-sm">Your statement has been parsed and is being analyzed...</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="bg-gray-800/50 rounded-lg p-4">
                                            <p className="text-gray-400 text-sm mb-1">Transactions</p>
                                            <p className="text-white text-2xl font-bold">{uploadResult.transaction_count}</p>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-4">
                                            <p className="text-gray-400 text-sm mb-1">Unique Accounts</p>
                                            <p className="text-white text-2xl font-bold">{uploadResult.statistics?.unique_accounts || 0}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
                                        <Loader className="animate-spin" size={20} />
                                        <span className="text-sm">Analyzing for fraud patterns...</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UploadModal;
