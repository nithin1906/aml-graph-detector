"""
Model inference service for analyzing uploaded statements.
"""

import torch
import torch.nn.functional as F
import networkx as nx
import numpy as np
from typing import Dict, List, Tuple
from pathlib import Path


class ModelInference:
    """Runs inference on transaction graphs using trained GNN model."""
    
    def __init__(self, model_path: str = None):
        """
        Initialize inference service.
        
        Args:
            model_path: Path to trained model file
        """
        self.model = None
        self.model_path = model_path or "backend/models/gnn_model.pth"
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    def load_model(self):
        """Load the trained GNN model."""
        try:
            if Path(self.model_path).exists():
                self.model = torch.load(self.model_path, map_location=self.device)
                self.model.eval()
                print(f"Model loaded from {self.model_path}")
            else:
                print(f"Model file not found at {self.model_path}")
                # For now, we'll use a mock model
                self.model = None
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            self.model = None
    
    def analyze_graph(self, G: nx.DiGraph, node_features: Dict[str, np.ndarray]) -> Dict[str, any]:
        """
        Analyze transaction graph and detect suspicious patterns.
        
        Args:
            G: NetworkX graph
            node_features: Dictionary of node features
            
        Returns:
            Analysis results including risk scores and flagged transactions
        """
        results = {
            'overall_risk_score': 0.0,
            'suspicious_transactions': [],
            'suspicious_accounts': [],
            'circular_patterns': [],
            'risk_breakdown': {},
            'statistics': {}
        }
        
        # Detect circular patterns
        from .graph_builder import GraphBuilder
        builder = GraphBuilder()
        cycles = builder.detect_circular_patterns(G, max_length=5)
        results['circular_patterns'] = [
            {
                'accounts': cycle,
                'length': len(cycle),
                'risk_score': self._calculate_cycle_risk(G, cycle)
            }
            for cycle in cycles
        ]
        
        # Calculate node-level risk scores AND reasons
        node_risks_and_reasons = self._calculate_node_risks(G, node_features)
        
        # Format suspicious accounts list
        results['suspicious_accounts'] = [
            {
                'account_id': node,
                'risk_score': float(data['score']),
                'reason': "; ".join(data['reasons']) if data['reasons'] else "Unusual activity detected"
            }
            for node, data in sorted(node_risks_and_reasons.items(), key=lambda x: x[1]['score'], reverse=True)
            if data['score'] > 0.4
        ][:20]  # Top 20
        
        # Identify suspicious transactions
        # We need a simplified risk map for this function
        simple_node_risks = {k: v['score'] for k, v in node_risks_and_reasons.items()}
        suspicious_txns = self._identify_suspicious_transactions(G, simple_node_risks)
        results['suspicious_transactions'] = suspicious_txns[:50]  # Top 50
        
        # Calculate overall risk score
        results['overall_risk_score'] = self._calculate_overall_risk(
            len(cycles),
            len(results['suspicious_accounts']),
            len(suspicious_txns),
            G.number_of_nodes()
        )
        
        # Risk breakdown
        results['risk_breakdown'] = {
            'circular_trading': min(len(cycles) / max(G.number_of_nodes() * 0.1, 1), 1.0),
            'high_risk_accounts': len(results['suspicious_accounts']) / max(G.number_of_nodes(), 1),
            'suspicious_transactions': len(suspicious_txns) / max(G.number_of_edges(), 1)
        }
        
        # Graph statistics
        results['statistics'] = builder.calculate_graph_statistics(G)
        
        return results
    
    def _calculate_node_risks(self, G: nx.DiGraph, node_features: Dict[str, np.ndarray]) -> Dict[str, Dict]:
        """
        Calculate risk score for each node with enhanced fraud detection.
        Returns: Dict[node_id, {'score': float, 'reasons': List[str]}]
        """
        node_data = {}
        
        for node in G.nodes():
            risk = 0.0
            reasons = []
            
            # Get basic metrics
            in_edges = list(G.in_edges(node, data=True))
            out_edges = list(G.out_edges(node, data=True))
            
            in_degree = len(in_edges)
            out_degree = len(out_edges)
            
            in_volume = sum([d['weight'] for _, _, d in in_edges])
            out_volume = sum([d['weight'] for _, _, d in out_edges])
            total_volume = in_volume + out_volume
            
            # --- 1. SMURFING / FAN-OUT (Structuring) ---
            # Single source -> Many small targets
            if out_degree > 5:
                avg_out = out_volume / out_degree
                # Standard smurfing: many small payments just under threshold?
                # Or simply splitting a large sum into many chunks
                if avg_out < 500000: # Small average payments
                     risk += 0.3
                     reasons.append("Potential Smurfing (Fan-Out)")
            
            # --- 2. AGGREGATION / FAN-IN ---
            # Many sources -> Single target
            if in_degree > 5:
                avg_in = in_volume / in_degree
                if avg_in < 500000:
                    risk += 0.3
                    reasons.append("Potential Aggregation (Fan-In)")

            # --- 3. LAYERING / FLOW-THROUGH (Mule Account) ---
            # High volume in, similar volume out (Pass-through entity)
            if in_volume > 1000000 and out_volume > 1000000:
                balance_ratio = abs(in_volume - out_volume) / (in_volume + 1e-9)
                if balance_ratio < 0.15: # In and Out overlap by 85%+
                    risk += 0.6
                    reasons.append("Layering/Flow-Through Entity")

            # --- 4. SCATTER-GATHER (Star Topology) ---
            # Harder to detect on single node, but if node connects to another node that connects back to a related entity
            # Simplified: High degree + High volume is a 'Hub' often used in Scatter-Gather
            if (in_degree + out_degree) > 12 and total_volume > 5000000:
                risk += 0.4
                reasons.append("High-Volume Hub (Scatter-Gather)")

            # --- 5. STRUCTURING (Threshold Avoidance) ---
            in_transactions = []
            for _, _, d in in_edges:
                in_transactions.extend(d.get('transactions', []))
            
            near_threshold_count = sum(1 for txn in in_transactions 
                                      if 800000 <= txn['amount'] <= 999999)
            if near_threshold_count >= 2:
                risk += 0.4
                reasons.append("Structuring (Threshold Avoidance)")

            # --- 6. CIRCULAR TRADING ---
            try:
                cycles = list(nx.simple_cycles(G))
                in_cycle = any(node in cycle for cycle in cycles if len(cycle) >= 3)
                if in_cycle:
                    risk += 0.5
                    reasons.append("Circular Trading Participant")
            except:
                pass
            
            # --- BASELINE CHECKS ---
            if total_volume > 5000000:
                risk += 0.2
                if "High Volume" not in reasons: reasons.append("High Transaction Volume")
            
            node_data[node] = {
                'score': min(risk, 1.0),
                'reasons': list(set(reasons)) # dedup
            }
        
        return node_data
    
    def _identify_suspicious_transactions(self, G: nx.DiGraph, node_risks: Dict[str, float]) -> List[Dict]:
        """Identify suspicious transactions with enhanced detection."""
        suspicious = []
        
        for u, v, data in G.edges(data=True):
            risk_score = 0.0
            reasons = []
            
            # 1. HIGH AMOUNT DETECTION (INR)
            if data['weight'] > 5000000:  # 50 Lakh
                risk_score += 0.4
                reasons.append(f"Very high transaction amount (Rs.{data['weight']:,.2f})")
            elif data['weight'] > 2000000:  # 20 Lakh
                risk_score += 0.3
                reasons.append(f"High transaction amount (Rs.{data['weight']:,.2f})")
            elif data['weight'] > 1000000:  # 10 Lakh
                risk_score += 0.2
                reasons.append(f"Significant transaction amount (Rs.{data['weight']:,.2f})")
            
            # 2. INVOLVES HIGH-RISK ACCOUNTS
            sender_risk = node_risks.get(u, 0)
            receiver_risk = node_risks.get(v, 0)
            if sender_risk > 0.7 or receiver_risk > 0.7:
                risk_score += 0.5
                reasons.append("Involves very high-risk account")
            elif sender_risk > 0.5 or receiver_risk > 0.5:
                risk_score += 0.3
                reasons.append("Involves high-risk account")
            
            # 3. MULTIPLE TRANSACTIONS (Structuring)
            if data['count'] > 10:
                risk_score += 0.4
                reasons.append(f"Very high frequency ({data['count']} transactions)")
            elif data['count'] > 5:
                risk_score += 0.3
                reasons.append(f"High frequency ({data['count']} transactions)")
            
            # 4. CIRCULAR PATTERN DETECTION
            try:
                if nx.has_path(G, v, u):  # Potential cycle
                    risk_score += 0.4
                    reasons.append("Part of circular trading pattern")
            except:
                pass
            
            # 5. ROUND NUMBER DETECTION
            round_txn_count = sum(1 for txn in data['transactions'] 
                                 if txn['amount'] % 100000 == 0)
            if round_txn_count >= 2:
                risk_score += 0.3
                reasons.append("Multiple round-number transactions")
            
            # 6. STRUCTURING DETECTION (Near-threshold amounts)
            near_threshold_count = sum(1 for txn in data['transactions']
                                      if 800000 <= txn['amount'] <= 999999)
            if near_threshold_count >= 2:
                risk_score += 0.4
                reasons.append("Potential structuring (amounts near threshold)")
            
            # Lower threshold for flagging (was 0.5, now 0.4)
            if risk_score > 0.4:
                for txn in data['transactions']:
                    suspicious.append({
                        'from_account': u,
                        'to_account': v,
                        'amount': float(txn['amount']),
                        'date': str(txn['date']),
                        'transaction_id': txn.get('transaction_id', ''),
                        'risk_score': float(min(risk_score, 1.0)),
                        'reasons': reasons
                    })
        
        # Sort by risk score
        suspicious.sort(key=lambda x: x['risk_score'], reverse=True)
        return suspicious
    
    def _calculate_cycle_risk(self, G: nx.DiGraph, cycle: List[str]) -> float:
        """Calculate risk score for a circular pattern."""
        risk = 0.5  # Base risk for any cycle
        
        # Longer cycles are more suspicious
        if len(cycle) >= 4:
            risk += 0.2
        
        # High transaction volumes in cycle
        total_volume = 0
        for i in range(len(cycle)):
            u = cycle[i]
            v = cycle[(i + 1) % len(cycle)]
            if G.has_edge(u, v):
                total_volume += G[u][v]['weight']
        
        if total_volume > 5000000:  # 50 Lakh INR
            risk += 0.3
        
        return min(risk, 1.0)
    
    def _get_risk_reason(self, G: nx.DiGraph, node: str, risk: float) -> str:
        """Get human-readable reason for risk score."""
        reasons = []
        
        degree = G.in_degree(node) + G.out_degree(node)
        if degree > 10:
            reasons.append(f"High number of connections ({degree})")
        
        in_volume = sum([G[u][node]['weight'] for u in G.predecessors(node)])
        out_volume = sum([G[node][v]['weight'] for v in G.successors(node)])
        total_volume = in_volume + out_volume
        
        if total_volume > 1000000:  # 10 Lakh INR
            reasons.append(f"High transaction volume (Rs.{total_volume:,.2f})")
        
        try:
            cycles = list(nx.simple_cycles(G))
            in_cycle = any(node in cycle for cycle in cycles)
            if in_cycle:
                reasons.append("Part of circular trading pattern")
        except:
            pass
        
        return "; ".join(reasons) if reasons else "Unusual transaction pattern"
    
    def _calculate_overall_risk(self, num_cycles: int, num_suspicious_accounts: int, 
                                num_suspicious_txns: int, total_nodes: int) -> float:
        """Calculate overall risk score for the statement with improved sensitivity."""
        risk = 0.0
        
        # Circular patterns (more weight)
        if num_cycles > 0:
            risk += min(num_cycles / max(total_nodes * 0.05, 1), 0.5)
        
        # Suspicious accounts (more weight)
        if num_suspicious_accounts > 0:
            risk += min(num_suspicious_accounts / max(total_nodes, 1), 0.4)
        
        # Suspicious transactions (more weight)
        if num_suspicious_txns > 0:
            # Linear scaling: 20 txns = 0.4, 50 txns = 1.0 (capped at 0.8)
            risk += min(num_suspicious_txns / 20, 0.8)
        
        # High Value Fraud Boost
        # If we found strong patterns like Layering or Structuring, boost risk significantly
        # This inference is stateless, so we infer severity from the count of flags
        if num_suspicious_accounts > 0 and num_cycles > 0:
            risk += 0.2  # Multi-vector attack

        # Ensure dynamic range between 0.1 and 0.99
        # Base risk if any activity found
        if num_cycles > 0 or num_suspicious_accounts > 0 or num_suspicious_txns > 0:
            risk = max(risk, 0.45) 
            risk = min(risk, 0.98) # Cap at 98%
        
        return float(f"{risk:.2f}")
