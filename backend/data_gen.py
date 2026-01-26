import networkx as nx
import random
import pandas as pd
import torch
from torch_geometric.data import Data

def generate_synthetic_data(num_users=100, num_transactions=200, num_laundering_rings=3):
    """
    Generates a synthetic transaction graph with injected money laundering patterns (cycles).
    """
    G = nx.DiGraph()
    
    # Add users
    for i in range(num_users):
        G.add_node(i, type='user', risk_score=random.random())

    # Add random transactions
    for _ in range(num_transactions):
        u = random.randint(0, num_users - 1)
        v = random.randint(0, num_users - 1)
        if u != v:
            amount = round(random.uniform(10, 10000), 2)
            G.add_edge(u, v, amount=amount, is_laundering=False)

    # Inject money laundering rings (cycles)
    laundering_nodes = []
    for _ in range(num_laundering_rings):
        ring_size = random.randint(3, 6)
        ring_nodes = random.sample(range(num_users), ring_size)
        laundering_nodes.extend(ring_nodes)
        
        # Create a cycle: n1 -> n2 -> ... -> nk -> n1
        for i in range(len(ring_nodes)):
            u = ring_nodes[i]
            v = ring_nodes[(i + 1) % len(ring_nodes)]
            amount = round(random.uniform(5000, 9000), 2) # High consistent amounts
            
            # Update or add edge
            G.add_edge(u, v, amount=amount, is_laundering=True)

    return G

def convert_to_pyg_data(G):
    """
    Converts NetworkX graph to PyTorch Geometric Data object.
    """
    # Node features: [risk_score] (dummy feature for now)
    # In a real scenario, this would be more complex (e.g., account age, location, etc.)
    x = torch.tensor([[G.nodes[i]['risk_score']] for i in G.nodes], dtype=torch.float)
    
    # Edge index
    edge_index = torch.tensor(list(G.edges)).t().contiguous()
    
    # Edge attributes: [amount]
    edge_attr = torch.tensor([[G.edges[u, v]['amount']] for u, v in G.edges], dtype=torch.float)
    
    # Labels: 1 if node is part of a laundering ring, 0 otherwise
    # Note: This is a simplification. In reality, we might label edges or subgraphs.
    # Here we label nodes if they are part of ANY laundering transaction.
    y = torch.zeros(G.number_of_nodes(), dtype=torch.long)
    
    for u, v, data in G.edges(data=True):
        if data.get('is_laundering', False):
            y[u] = 1
            y[v] = 1

    return Data(x=x, edge_index=edge_index, edge_attr=edge_attr, y=y)

if __name__ == "__main__":
    G = generate_synthetic_data()
    print(f"Generated graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.")
    data = convert_to_pyg_data(G)
    print(f"PyG Data object: {data}")
