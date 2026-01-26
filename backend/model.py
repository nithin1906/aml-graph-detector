import torch
import torch.nn.functional as F
from torch_geometric.nn import GCNConv
from torch_geometric.nn.norm import BatchNorm

class GCN(torch.nn.Module):
    def __init__(self, num_node_features, num_classes, hidden_dim=64, num_layers=3, dropout=0.5):
        super(GCN, self).__init__()
        
        # Input layer
        self.conv1 = GCNConv(num_node_features, hidden_dim)
        self.bn1 = BatchNorm(hidden_dim)
        
        # Hidden layers
        self.conv_layers = torch.nn.ModuleList()
        self.bn_layers = torch.nn.ModuleList()
        
        for _ in range(num_layers - 2):
            self.conv_layers.append(GCNConv(hidden_dim, hidden_dim))
            self.bn_layers.append(BatchNorm(hidden_dim))
        
        # Output layer
        self.conv_out = GCNConv(hidden_dim, num_classes)
        self.dropout = dropout

    def forward(self, data):
        x, edge_index = data.x, data.edge_index

        # Input layer
        x = self.conv1(x, edge_index)
        x = self.bn1(x)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)

        # Hidden layers
        for conv, bn in zip(self.conv_layers, self.bn_layers):
            x = conv(x, edge_index)
            x = bn(x)
            x = F.relu(x)
            x = F.dropout(x, p=self.dropout, training=self.training)

        # Output layer
        x = self.conv_out(x, edge_index)
        
        return F.log_softmax(x, dim=1)
