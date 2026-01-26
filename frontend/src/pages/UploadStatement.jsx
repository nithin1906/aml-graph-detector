import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UploadStatement = () => {
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

            // Navigate to dashboard with analysis results
            navigate(`/dashboard?analysis_id=${response.data.analysis_id}&upload_id=${uploadId}`);

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

    return (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl font-bold mb-4 gradient-text">Upload Bank Statement</h1>
                    <p className="text-gray-400 text-lg">
                        Upload your bank statement for AI-powered fraud detection analysis
                    </p>
                </motion.div>

                {/* Upload Area */}
                <motion.div
                    className="bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-2xl p-8 mb-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div
                        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${dragActive
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-white/20 hover:border-white/40'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <Upload size={64} className="mx-auto mb-4 text-blue-400" />
                        <h3 className="text-xl font-bold text-white mb-2">
                            Drop your file here or click to browse
                        </h3>
                        <p className="text-gray-400 mb-6">
                            Supports CSV, Excel (.xlsx, .xls), and PDF formats
                        </p>

                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".csv,.xlsx,.xls,.pdf"
                            onChange={handleFileChange}
                        />
                        <label
                            htmlFor="file-upload"
                            className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg cursor-pointer transition-colors"
                        >
                            Select File
                        </label>
                    </div>

                    {/* Selected File */}
                    {file && (
                        <motion.div
                            className="mt-6 p-4 bg-white/5 rounded-lg flex items-center justify-between"
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
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <Loader className="animate-spin" size={20} />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        Upload & Analyze
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 flex items-start gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AlertCircle className="text-red-400 flex-shrink-0" size={24} />
                        <div>
                            <h4 className="text-red-400 font-semibold mb-1">Error</h4>
                            <p className="text-red-300">{error}</p>
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
                                <p className="text-green-300">Your statement has been parsed and is being analyzed...</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4">
                                <p className="text-gray-400 text-sm mb-1">Transactions</p>
                                <p className="text-white text-2xl font-bold">{uploadResult.transaction_count}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <p className="text-gray-400 text-sm mb-1">Unique Accounts</p>
                                <p className="text-white text-2xl font-bold">{uploadResult.statistics?.unique_accounts || 0}</p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
                            <Loader className="animate-spin" size={20} />
                            <span>Analyzing for fraud patterns...</span>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default UploadStatement;
