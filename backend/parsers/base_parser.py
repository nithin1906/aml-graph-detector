"""
Base parser class defining the interface for all statement parsers.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any
import pandas as pd
from datetime import datetime


class BaseParser(ABC):
    """Abstract base class for bank statement parsers."""
    
    # Standard column names for all parsers
    STANDARD_COLUMNS = [
        'transaction_id',
        'date',
        'from_account',
        'to_account',
        'amount',
        'currency',
        'description'
    ]
    
    def __init__(self):
        self.required_columns = ['date', 'from_account', 'to_account', 'amount']
        self.optional_columns = ['transaction_id', 'currency', 'description']
    
    @abstractmethod
    def parse(self, file_path: str) -> pd.DataFrame:
        """
        Parse the bank statement file and return standardized DataFrame.
        
        Args:
            file_path: Path to the statement file
            
        Returns:
            DataFrame with standardized columns
        """
        pass
    
    def validate(self, df: pd.DataFrame) -> tuple[bool, List[str]]:
        """
        Validate the parsed DataFrame.
        
        Args:
            df: Parsed DataFrame
            
        Returns:
            Tuple of (is_valid, list of error messages)
        """
        errors = []
        
        # Check required columns
        missing_cols = set(self.required_columns) - set(df.columns)
        if missing_cols:
            errors.append(f"Missing required columns: {missing_cols}")
        
        # Check for empty DataFrame
        if df.empty:
            errors.append("No transactions found in file")
        
        # Validate data types
        if 'amount' in df.columns:
            try:
                df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
                if df['amount'].isna().any():
                    errors.append("Invalid amount values found")
            except Exception as e:
                errors.append(f"Amount validation error: {str(e)}")
        
        # Validate dates
        if 'date' in df.columns:
            try:
                df['date'] = pd.to_datetime(df['date'], errors='coerce')
                if df['date'].isna().any():
                    errors.append("Invalid date values found")
            except Exception as e:
                errors.append(f"Date validation error: {str(e)}")
        
        return len(errors) == 0, errors
    
    def standardize(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Standardize the DataFrame to match the required format.
        
        Args:
            df: Input DataFrame
            
        Returns:
            Standardized DataFrame
        """
        # Add missing optional columns
        if 'transaction_id' not in df.columns:
            df['transaction_id'] = [f"TX{i:06d}" for i in range(len(df))]
        
        if 'currency' not in df.columns:
            df['currency'] = 'USD'
        
        if 'description' not in df.columns:
            df['description'] = ''
        
        # Ensure all standard columns are present
        for col in self.STANDARD_COLUMNS:
            if col not in df.columns:
                df[col] = None
        
        # Reorder columns
        df = df[self.STANDARD_COLUMNS]
        
        # Clean data
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df['from_account'] = df['from_account'].astype(str).str.strip()
        df['to_account'] = df['to_account'].astype(str).str.strip()
        
        # Remove rows with missing critical data
        df = df.dropna(subset=['date', 'from_account', 'to_account', 'amount'])
        
        return df
    
    def get_required_columns(self) -> List[str]:
        """Return list of required column names."""
        return self.required_columns
    
    def get_column_mapping(self) -> Dict[str, List[str]]:
        """
        Return common column name variations for mapping.
        Override in subclasses for format-specific mappings.
        """
        return {
            'date': ['date', 'transaction_date', 'trans_date', 'datetime', 'timestamp'],
            'from_account': ['from', 'from_account', 'sender', 'debit_account', 'source'],
            'to_account': ['to', 'to_account', 'receiver', 'credit_account', 'destination'],
            'amount': ['amount', 'value', 'transaction_amount', 'sum'],
            'debit': ['debit', 'debit (-)', 'debit(-)', 'withdrawal', 'withdrawals', 'dr'],
            'credit': ['credit', 'credit (+)', 'credit(+)', 'deposit', 'deposits', 'cr'],
            'balance': ['balance', 'running_balance', 'closing_balance', 'bal'],
            'currency': ['currency', 'curr', 'ccy'],
            'description': ['description', 'details', 'memo', 'narration', 'remarks']
        }
    
    def map_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Map column names from various formats to standard names.
        
        Args:
            df: Input DataFrame with original column names
            
        Returns:
            DataFrame with standardized column names
        """
        column_mapping = self.get_column_mapping()
        df_columns_lower = {col: col.lower().strip() for col in df.columns}
        
        rename_dict = {}
        for standard_col, variations in column_mapping.items():
            for col_name, col_lower in df_columns_lower.items():
                if col_lower in [v.lower() for v in variations]:
                    rename_dict[col_name] = standard_col
                    break
        
        df = df.rename(columns=rename_dict)
        return df
