"""
Graph builder service for converting transactions to graph format.
"""

import pandas as pd
import networkx as nx
from typing import Dict, List, Tuple
import numpy as np


class GraphBuilder:
    """Builds transaction graphs from parsed statement data."""
    
    def __init__(self):
        self.graph = None
        self.node_features = None
        self.edge_features = None
    
    def build_graph(self, df: pd.DataFrame) -> nx.DiGraph:
        """
        Build directed graph from transaction DataFrame.
        
        Args:
            df: Standardized transaction DataFrame
            
        Returns:
            NetworkX DiGraph
        """
        G = nx.DiGraph()
        
        # Add nodes (accounts)
        accounts = set(df['from_account'].unique()) | set(df['to_account'].unique())
        G.add_nodes_from(accounts)
        
        # Add edges (transactions)
        for _, row in df.iterrows():
            from_acc = row['from_account']
            to_acc = row['to_account']
            amount = row['amount']
            date = row['date']
            
            # Add or update edge
            if G.has_edge(from_acc, to_acc):
                # Update existing edge
                G[from_acc][to_acc]['weight'] += amount
                G[from_acc][to_acc]['count'] += 1
                G[from_acc][to_acc]['transactions'].append({
                    'amount': amount,
                    'date': date,
                    'transaction_id': row.get('transaction_id', '')
                })
            else:
                # Create new edge
                G.add_edge(from_acc, to_acc, 
                          weight=amount,
                          count=1,
                          transactions=[{
                              'amount': amount,
                              'date': date,
                              'transaction_id': row.get('transaction_id', '')
                          }])
        
        self.graph = G
        return G
    
    def extract_node_features(self, G: nx.DiGraph) -> Dict[str, np.ndarray]:
        """
        Extract features for each node (account).
        
        Args:
            G: NetworkX graph
            
        Returns:
            Dictionary mapping node IDs to feature vectors
        """
        node_features = {}
        
        for node in G.nodes():
            features = []
            
            # Degree features
            in_degree = G.in_degree(node)
            out_degree = G.out_degree(node)
            total_degree = in_degree + out_degree
            
            features.extend([in_degree, out_degree, total_degree])
            
            # Transaction volume features
            in_volume = sum([G[u][node]['weight'] for u in G.predecessors(node)])
            out_volume = sum([G[node][v]['weight'] for v in G.successors(node)])
            total_volume = in_volume + out_volume
            
            features.extend([in_volume, out_volume, total_volume])
            
            # Centrality features
            try:
                betweenness = nx.betweenness_centrality(G)[node]
                closeness = nx.closeness_centrality(G)[node]
                pagerank = nx.pagerank(G)[node]
            except:
                betweenness = 0
                closeness = 0
                pagerank = 0
            
            features.extend([betweenness, closeness, pagerank])
            
            # Clustering coefficient
            try:
                clustering = nx.clustering(G.to_undirected())[node]
            except:
                clustering = 0
            
            features.append(clustering)
            
            node_features[node] = np.array(features, dtype=np.float32)
        
        self.node_features = node_features
        return node_features
    
    def detect_circular_patterns(self, G: nx.DiGraph, max_length: int = 5) -> List[List[str]]:
        """
        Detect circular trading patterns in the graph.
        
        Args:
            G: NetworkX graph
            max_length: Maximum cycle length to detect
            
        Returns:
            List of cycles (each cycle is a list of node IDs)
        """
        cycles = []
        
        try:
            # Find all simple cycles
            all_cycles = list(nx.simple_cycles(G))
            
            # Filter by length
            cycles = [cycle for cycle in all_cycles if len(cycle) <= max_length]
            
        except Exception as e:
            print(f"Error detecting cycles: {str(e)}")
        
        return cycles
    
    def calculate_graph_statistics(self, G: nx.DiGraph) -> Dict[str, any]:
        """
        Calculate graph-level statistics.
        
        Args:
            G: NetworkX graph
            
        Returns:
            Dictionary of statistics
        """
        stats = {
            'num_nodes': G.number_of_nodes(),
            'num_edges': G.number_of_edges(),
            'density': nx.density(G),
            'num_cycles': 0,
            'avg_clustering': 0,
            'num_components': 0
        }
        
        # Count cycles
        try:
            cycles = list(nx.simple_cycles(G))
            stats['num_cycles'] = len(cycles)
        except:
            pass
        
        # Average clustering coefficient
        try:
            stats['avg_clustering'] = nx.average_clustering(G.to_undirected())
        except:
            pass
        
        # Number of connected components
        try:
            stats['num_components'] = nx.number_weakly_connected_components(G)
        except:
            pass
        
        return stats
    
    def get_subgraph_around_node(self, G: nx.DiGraph, node: str, radius: int = 2) -> nx.DiGraph:
        """
        Extract subgraph around a specific node.
        
        Args:
            G: NetworkX graph
            node: Center node
            radius: Number of hops to include
            
        Returns:
            Subgraph
        """
        # Get nodes within radius
        nodes_to_include = {node}
        current_layer = {node}
        
        for _ in range(radius):
            next_layer = set()
            for n in current_layer:
                # Add predecessors and successors
                next_layer.update(G.predecessors(n))
                next_layer.update(G.successors(n))
            nodes_to_include.update(next_layer)
            current_layer = next_layer
        
        # Create subgraph
        subgraph = G.subgraph(nodes_to_include).copy()
        return subgraph
