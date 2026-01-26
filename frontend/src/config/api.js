const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
    baseURL: API_BASE_URL,
    endpoints: {
        graph: `${API_BASE_URL}/api/graph`,
        analyze: `${API_BASE_URL}/api/analyze`,
        regenerate: `${API_BASE_URL}/api/regenerate`,
        // Statement analysis endpoints
        uploadStatement: `${API_BASE_URL}/api/upload-statement`,
        analyzeStatement: (id) => `${API_BASE_URL}/api/analyze-statement/${id}`,
        analysisResults: (id) => `${API_BASE_URL}/api/analysis-results/${id}`,
        graphData: (id) => `${API_BASE_URL}/api/graph-data/${id}`,
    }
};

export default api;

