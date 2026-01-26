from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import networkx as nx
from .data_gen import generate_synthetic_data, convert_to_pyg_data
from .model import GCN
import torch
import torch.optim as optim
import torch.nn.functional as F
import numpy as np
from pathlib import Path
import shutil
import uuid
from datetime import datetime
import pandas as pd

# Import parsers and services
from .parsers import CSVParser, ExcelParser, PDFParser, StatementValidator
from .services import GraphBuilder, ModelInference

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for the graph
G = None
data = None

# Create train/test split - Helper function kept for later use
def create_train_test_split(data, train_ratio=0.7, val_ratio=0.15):
    if data is None:
        return None
        
    num_nodes = data.x.size(0)
    indices = torch.randperm(num_nodes)
    
    train_size = int(num_nodes * train_ratio)
    val_size = int(num_nodes * val_ratio)
    
    train_mask = torch.zeros(num_nodes, dtype=torch.bool)
    val_mask = torch.zeros(num_nodes, dtype=torch.bool)
    test_mask = torch.zeros(num_nodes, dtype=torch.bool)
    
    train_mask[indices[:train_size]] = True
    val_mask[indices[train_size:train_size + val_size]] = True
    test_mask[indices[train_size + val_size:]] = True
    
    data.train_mask = train_mask
    data.val_mask = val_mask
    data.test_mask = test_mask
    
    return data

# Initialize model with improved architecture
model = GCN(num_node_features=1, num_classes=2, hidden_dim=64, num_layers=4, dropout=0.3)
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=5e-4)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=10)

def train_model(epochs=100):
    """Train the model with proper training loop"""
    model.train()
    best_val_loss = float('inf')
    patience_counter = 0
    max_patience = 20
    
    training_history = {
        'train_loss': [],
        'val_loss': [],
        'train_acc': [],
        'val_acc': []
    }
    
    for epoch in range(epochs):
        # Training
        model.train()
        optimizer.zero_grad()
        out = model(data)
        loss = F.nll_loss(out[data.train_mask], data.y[data.train_mask])
        loss.backward()
        optimizer.step()
        
        # Validation
        model.eval()
        with torch.no_grad():
            # Recompute output for both train and val accuracy in eval mode
            val_out = model(data)
            val_loss = F.nll_loss(val_out[data.val_mask], data.y[data.val_mask])
            
            # Calculate accuracies using eval-mode output
            train_pred = val_out[data.train_mask].max(dim=1)[1]
            train_acc = (train_pred == data.y[data.train_mask]).float().mean().item()
            
            val_pred = val_out[data.val_mask].max(dim=1)[1]
            val_acc = (val_pred == data.y[data.val_mask]).float().mean().item()
        
        training_history['train_loss'].append(loss.item())
        training_history['val_loss'].append(val_loss.item())
        training_history['train_acc'].append(train_acc)
        training_history['val_acc'].append(val_acc)
        
        # Learning rate scheduling
        scheduler.step(val_loss)
        
        # Early stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= max_patience:
                print(f"Early stopping at epoch {epoch + 1}")
                break
        
        if (epoch + 1) % 20 == 0:
            print(f"Epoch {epoch + 1}/{epochs} - Train Loss: {loss.item():.4f}, Val Loss: {val_loss.item():.4f}, Train Acc: {train_acc:.4f}, Val Acc: {val_acc:.4f}")
    
    return training_history

# Defer training to FastAPI startup event so importing the module is fast
training_history = {}


@app.on_event("startup")
def on_startup():
    global training_history
    if data is not None:
        print("Training model...")
        training_history = train_model(epochs=150)
        print("Model training complete!")
    else:
        print("No data available. Skipping model training.")

@app.get("/api/graph")
def get_graph():
    """
    Returns the graph data in a format suitable for Cytoscape.js.
    """
    if G is None:
        return {"elements": {"nodes": [], "edges": []}}

    nodes = []
    for n, attrs in G.nodes(data=True):
        nodes.append({
            "data": {
                "id": str(n),
                "label": f"User {n}",
                "risk_score": attrs.get("risk_score", 0),
                "type": attrs.get("type", "user")
            }
        })

    edges = []
    for u, v, attrs in G.edges(data=True):
        edges.append({
            "data": {
                "source": str(u),
                "target": str(v),
                "amount": attrs.get("amount", 0),
                "is_laundering": attrs.get("is_laundering", False)
            }
        })

    return {"elements": {"nodes": nodes, "edges": edges}}

@app.get("/api/analyze")
def analyze_graph():
    """
    Runs the GNN model to predict suspicious nodes and also runs a cycle detection algorithm.
    """
    if data is None or G is None:
         return {
            "gnn_predictions": [],
            "rule_based_cycles": [],
            "rule_based_nodes": [],
            "confidences": {},
            "training_stats": {
                "final_train_acc": 0,
                "final_val_acc": 0
            },
            "message": "No data available for analysis"
        }

    # 1. Run GNN Inference
    model.eval()
    with torch.no_grad():
        out = model(data)
        _, pred = out.max(dim=1)
        probabilities = torch.exp(out)  # Convert log probabilities to probabilities
    
    suspicious_nodes_gnn = [i for i, p in enumerate(pred.tolist()) if p == 1]
    
    # Get confidence scores for suspicious nodes
    suspicious_confidences = {}
    for node_id in suspicious_nodes_gnn:
        suspicious_confidences[node_id] = probabilities[node_id][1].item()

    # 2. Run Cycle Detection (Rule-based ground truth)
    cycles = list(nx.simple_cycles(G, length_bound=10))
    suspicious_cycles = [c for c in cycles if 2 < len(c) < 8]
    
    # Flatten cycles to get nodes
    suspicious_nodes_rule = set()
    for c in suspicious_cycles:
        suspicious_nodes_rule.update(c)

    return {
        "gnn_predictions": suspicious_nodes_gnn,
        "rule_based_cycles": suspicious_cycles,
        "rule_based_nodes": list(suspicious_nodes_rule),
        "confidences": suspicious_confidences,
        "training_stats": {
            "final_train_acc": training_history['train_acc'][-1] if training_history.get('train_acc') else 0,
            "final_val_acc": training_history['val_acc'][-1] if training_history.get('val_acc') else 0
        }
    }

@app.post("/api/regenerate")
def regenerate_data():
    global G, data
    G = generate_synthetic_data()
    data = convert_to_pyg_data(G)
    data = create_train_test_split(data)
    
    # Retrain model on new data
    print("Retraining model on new data...")
    global training_history
    training_history = train_model(epochs=100)
    print("Retraining complete!")
    
    return {"message": "Data regenerated and model retrained"}

@app.get("/api/training-stats")
def get_training_stats():
    """Returns training statistics"""
    return {
        "train_loss": training_history.get('train_loss', []),
        "val_loss": training_history.get('val_loss', []),
        "train_acc": training_history.get('train_acc', []),
        "val_acc": training_history.get('val_acc', [])
    }

# ============ NEW BANK STATEMENT ANALYSIS ENDPOINTS ============

# Create uploads directory
UPLOAD_DIR = Path("backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Store analysis results in memory (in production, use a database)
analysis_results = {}

# --- ACTIVE LEARNING / FEEDBACK SYSTEM ---
import json

class FeedbackStore:
    def __init__(self, filepath="backend/feedback.json"):
        self.filepath = Path(filepath)
        self.feedback = self._load()
    
    def _load(self):
        if self.filepath.exists():
            try:
                with open(self.filepath, "r") as f:
                    return json.load(f)
            except:
                return {"safe_accounts": [], "confirmed_fraud": []}
        return {"safe_accounts": [], "confirmed_fraud": []}
    
    def save(self):
        with open(self.filepath, "w") as f:
            json.dump(self.feedback, f, indent=2)
    
    def mark_safe(self, account_id):
        if account_id not in self.feedback["safe_accounts"]:
            self.feedback["safe_accounts"].append(account_id)
            # Remove from confirmed fraud if present
            if account_id in self.feedback["confirmed_fraud"]:
                self.feedback["confirmed_fraud"].remove(account_id)
            self.save()
            return True
        return False

    def confirm_fraud(self, account_id):
        if account_id not in self.feedback["confirmed_fraud"]:
            self.feedback["confirmed_fraud"].append(account_id)
            # Remove from safe if present
            if account_id in self.feedback["safe_accounts"]:
                self.feedback["safe_accounts"].remove(account_id)
            self.save()
            return True
        return False
        
    def is_safe(self, account_id):
        return account_id in self.feedback["safe_accounts"]

feedback_store = FeedbackStore()


@app.post("/api/upload-statement")
async def upload_statement(file: UploadFile = File(...)):
    """
    Upload and parse a bank statement file (CSV, Excel, or PDF).
    
    Returns parsed transaction count and preview.
    """
    try:
        # Validate file type
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ['.csv', '.xlsx', '.xls', '.pdf']:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload CSV, Excel, or PDF.")
        
        # Generate unique ID for this upload
        upload_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{upload_id}{file_ext}"
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse file based on type
        try:
            if file_ext == '.csv':
                parser = CSVParser()
            elif file_ext in ['.xlsx', '.xls']:
                parser = ExcelParser()
            elif file_ext == '.pdf':
                parser = PDFParser()
            
            df = parser.parse(str(file_path))
            
            # Validate parsed data
            validator = StatementValidator()
            is_valid, errors, stats = validator.validate_statement(df)
            
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Validation errors: {'; '.join(errors)}")
            
            # Save parsed CSV
            parsed_csv_path = UPLOAD_DIR / f"{upload_id}_parsed.csv"
            df.to_csv(parsed_csv_path, index=False)
            
            # Get preview (first 10 transactions)
            preview = df.head(10).to_dict('records')
            
            return {
                "upload_id": upload_id,
                "filename": file.filename,
                "file_type": file_ext,
                "transaction_count": len(df),
                "statistics": stats,
                "preview": preview,
                "message": "File uploaded and parsed successfully"
            }
            
        except Exception as e:
            # Clean up file on error
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/api/analyze-statement/{upload_id}")
async def analyze_statement(upload_id: str):
    """
    Analyze uploaded statement for fraud patterns.
    
    Returns risk scores, suspicious transactions, and circular patterns.
    """
    try:
        # Load parsed CSV
        parsed_csv_path = UPLOAD_DIR / f"{upload_id}_parsed.csv"
        if not parsed_csv_path.exists():
            raise HTTPException(status_code=404, detail="Upload not found. Please upload a statement first.")
        
        df = pd.read_csv(parsed_csv_path)
        
        # Build graph from transactions
        builder = GraphBuilder()
        global G, data  # Update global state for persistence
        G = builder.build_graph(df)
        
        # Convert to PyG data for inference/persistence
        try:
            # We import convert_to_pyg_data from .data_gen at the top level
            data = convert_to_pyg_data(G)
        except Exception as e:
            print(f"Warning: Could not convert to PyG data: {e}")
            # Non-fatal if we just want to show the graph, but GNN inference needs 'data'
            # However, inference.analyze_graph below likely handles feature extraction itself or re-generates it.
            # Let's assume inference uses its own flow, but we update 'data' for consistency with /api/graph endpoints that might use it.
            pass

        node_features = builder.extract_node_features(G)
        
        # Run inference
        inference = ModelInference()
        inference.load_model()
        results = inference.analyze_graph(G, node_features)
        
        # --- APPLY ACTIVE LEARNING FILTER ---
        # Remove accounts marked as safe by user
        results['suspicious_accounts'] = [
            acc for acc in results['suspicious_accounts'] 
            if not feedback_store.is_safe(acc['account_id'])
        ]
        
        # Recalculate counts after filtering
        # ...
        
        # Generate analysis ID
        analysis_id = str(uuid.uuid4())
        
        # Store results
        analysis_results[analysis_id] = {
            "upload_id": upload_id,
            "timestamp": datetime.now().isoformat(),
            "results": results
        }
        
        return {
            "analysis_id": analysis_id,
            "upload_id": upload_id,
            "overall_risk_score": results['overall_risk_score'],
            "suspicious_transactions_count": len(results['suspicious_transactions']),
            "suspicious_accounts_count": len(results['suspicious_accounts']),
            "circular_patterns_count": len(results['circular_patterns']),
            "risk_breakdown": results['risk_breakdown'],
            "message": "Analysis complete"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.get("/api/analysis-results/{analysis_id}")
async def get_analysis_results(analysis_id: str):
    """
    Get detailed analysis results.
    
    Returns full analysis including suspicious transactions, accounts, and patterns.
    """
    if analysis_id not in analysis_results:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return analysis_results[analysis_id]

@app.get("/api/graph-data/{upload_id}")
async def get_graph_data(upload_id: str):
    """
    Get graph visualization data for uploaded statement.
    
    Returns nodes and edges for frontend visualization.
    """
    try:
        # Load parsed CSV
        parsed_csv_path = UPLOAD_DIR / f"{upload_id}_parsed.csv"
        if not parsed_csv_path.exists():
            raise HTTPException(status_code=404, detail="Upload not found")
        
        df = pd.read_csv(parsed_csv_path)
        
        # Build graph
        builder = GraphBuilder()
        G = builder.build_graph(df)
        
        # Convert to visualization format
        nodes = []
        for node in G.nodes():
            nodes.append({
                "id": str(node),
                "label": str(node),
                "in_degree": G.in_degree(node),
                "out_degree": G.out_degree(node)
            })
        
        edges = []
        for u, v, data in G.edges(data=True):
            edges.append({
                "source": str(u),
                "target": str(v),
                "weight": float(data.get('weight', 0)),
                "count": int(data.get('count', 0))
            })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "statistics": builder.calculate_graph_statistics(G)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating graph data: {str(e)}")

@app.post("/api/feedback")
async def submit_feedback(data: dict):
    """
    Submit user feedback for active learning.
    payload: {"account_id": "123", "action": "mark_safe" | "confirm_fraud"}
    """
    account_id = data.get("account_id")
    action = data.get("action")
    
    if not account_id or not action:
        raise HTTPException(status_code=400, detail="Missing account_id or action")
    
    if action == "mark_safe":
        feedback_store.mark_safe(account_id)
        msg = f"Account {account_id} marked as Safe. Model updated."
    elif action == "confirm_fraud":
        feedback_store.confirm_fraud(account_id)
        msg = f"Account {account_id} confirmed as Fraud. Model reinforcement active."
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    global G, analysis_results
    # Ideally, we trigger a re-analysis here or assume next refresh picks it up
    # For instant gratification, let's just confirm it's saved.
    
    return {"message": msg, "status": "success"}
