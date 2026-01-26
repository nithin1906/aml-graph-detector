# AML Graph Detector (Anti-Money Laundering System)

## Overview
The **AML Graph Detector** is a specialized visualization and detection tool designed to help financial institutions identify sophisticated money laundering patterns and fraudulent networks. Unlike traditional spreadsheet-based analysis, this tool uses **Graph Neural Networks (GNN)** to visualize relationships between accounts and transactions.

## Features
*   **Interactive Graph Visualization**: Visualize complex transaction networks with nodes (accounts) and edges (transactions).
*   **Automated Fraud Detection**: Detects patterns like:
    *   **Circular Trading**: Closed loops of transactions (A -> B -> C -> A).
    *   **Structuring**: Breaking large transactions into smaller ones to evade detection.
    *   **Layering**: complex webs of transactions to hide the source of funds.
*   **Risk Scoring**: AI-driven risk scores for every entity based on behavior and connections.
*   **PDF Bank Statement Upload**: Parsing and analysis of bank statements directly from the dashboard.
*   **Dark/Light Mode**: User-friendly interface with theme support.

## Tech Stack
*   **Frontend**: React, Cytoscape.js (Graph Visualization), Tailwind CSS
*   **Backend**: Python (FastAPI), PyTorch Geometric (GNN Model), NetworkX
*   **Data Processing**: Pandas, PDF parsing tools

## Getting Started

### Prerequisites
*   **Python**: 3.8 or higher
*   **Node.js**: 16.0 or higher
*   **npm** or **yarn**

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/nithin1906/aml-graph-detector.git
    cd aml-graph-detector
    ```

2.  **Backend Setup**
    Navigate to the project root (where `venv` will be created):
    ```bash
    # Create virtual environment
    python -m venv venv

    # Activate virtual environment
    # Windows:
    .\venv\Scripts\activate
    # macOS/Linux:
    source venv/bin/activate

    # Install dependencies
    pip install -r backend/requirements.txt
    ```

3.  **Frontend Setup**
    Navigate to the `frontend` directory:
    ```bash
    cd frontend
    
    # Install dependencies
    npm install
    ```

## Running the Application

### 1. Start the Backend
From the project root (ensure `venv` is activated):
```bash
python manage.py runserver
# OR directly via uvicorn
uvicorn backend.main:app --reload
```
The backend API will be available at `http://localhost:8000`.

### 2. Start the Frontend
From the `frontend` directory:
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173` (or the port specified by Vite).

## Project Structure
```
aml-graph-detector/
├── backend/                # Python FastAPI backend
│   ├── main.py             # Entry point
│   ├── models/             # GNN and ML models
│   ├── parsers/            # PDF parsing logic
│   └── services/           # Business logic and graph algorithms
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   └── pages/          # Application pages (Dashboard, etc.)
├── venv/                   # Python virtual environment (excluded from git)
└── README.md               # Project documentation
```

## Contributing
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License
[MIT License](LICENSE)
