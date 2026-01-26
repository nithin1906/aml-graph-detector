# AML Graph Detector (Anti-Money Laundering System)

## Overview
The **AML Graph Detector** is a specialized visualization and detection tool designed to help financial institutions identify sophisticated money laundering patterns and fraudulent networks. Unlike traditional spreadsheet-based analysis, this tool uses **Graph Neural Networks (GNN)** to visualize relationships between accounts and transactions.

## Target Audience
**This application is built for:**
*   **Compliance Officers**: Professionals responsible for ensuring the bank adheres to AML regulations.
*   **Fraud Investigators**: Analysts who need to deep-dive into suspicious alerts to confirm illegal activity.
*   **Risk Management Teams**: Teams assessing the overall health and safety of the bank's transaction network.

**It is NOT for:**
*   **Retail Bank Customers**: This is an internal enterprise tool, not a consumer banking app.

## Key Use Cases

### 1. Visual Investigation
*   **Problem**: Money laundering often involves complex webs of transactions (layering) that are hard to spot in Excel.
*   **Solution**: The Graph View immediately reveals clusters, cycles, and high-degree nodes, making hidden relationships obvious.

### 2. Automated Cycle Detection
*   **Problem**: "Circular Trading" (A -> B -> C -> A) is a common technique to artificially inflate turnover.
*   **Solution**: The system automatically detects and flags these closed loops, which human analysts often miss in large datasets.

### 3. High-Risk Scoring
*   **Problem**: Not all high-value transactions are suspicious.
*   **Solution**: The AI assigns a "Risk Score" to every entity based on its behavior and connections, allowing officers to prioritize the most dangerous accounts.

## Tech Stack
*   **Frontend**: React, Cytoscape.js (Graph Visualization), Tailwind CSS
*   **Backend**: Python (FastAPI), PyTorch Geometric (GNN Model), NetworkX
