"""
Excel parser for bank statements.
"""

import pandas as pd
from typing import Optional
from .base_parser import BaseParser


class ExcelParser(BaseParser):
    """Parser for Excel format bank statements (.xlsx, .xls)."""
    
    def __init__(self):
        super().__init__()
        self.supported_extensions = ['.xlsx', '.xls']
    
    def parse(self, file_path: str) -> pd.DataFrame:
        """
        Parse Excel file and return standardized DataFrame.
        
        Args:
            file_path: Path to Excel file
            
        Returns:
            Standardized DataFrame
        """
        # Read Excel file
        try:
            # Try to read all sheets
            excel_file = pd.ExcelFile(file_path)
            sheet_names = excel_file.sheet_names
            
            # Find the sheet with transactions (usually the first or largest)
            df = self._find_transaction_sheet(excel_file, sheet_names)
            
            if df is None or df.empty:
                raise ValueError("No valid transaction data found in Excel file")
            
        except Exception as e:
            raise ValueError(f"Error reading Excel file: {str(e)}")
        
        # Map columns to standard names
        df = self.map_columns(df)
        
        # Standardize the DataFrame
        df = self.standardize(df)
        
        # Validate
        is_valid, errors = self.validate(df)
        if not is_valid:
            raise ValueError(f"Validation errors: {', '.join(errors)}")
        
        return df
    
    def _find_transaction_sheet(self, excel_file: pd.ExcelFile, sheet_names: list) -> Optional[pd.DataFrame]:
        """
        Find the sheet containing transaction data.
        
        Args:
            excel_file: ExcelFile object
            sheet_names: List of sheet names
            
        Returns:
            DataFrame from the most likely transaction sheet
        """
        best_df = None
        best_score = 0
        
        for sheet_name in sheet_names:
            try:
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                
                if df.empty:
                    continue
                
                # Score this sheet based on likelihood of containing transactions
                score = self._score_sheet(df)
                
                if score > best_score:
                    best_score = score
                    best_df = df
                    
            except Exception:
                continue
        
        return best_df
    
    def _score_sheet(self, df: pd.DataFrame) -> int:
        """
        Score a sheet based on likelihood of containing transaction data.
        
        Args:
            df: DataFrame to score
            
        Returns:
            Score (higher is better)
        """
        score = 0
        
        # Check for transaction-related column names
        column_mapping = self.get_column_mapping()
        columns_lower = [col.lower() if isinstance(col, str) else str(col).lower() for col in df.columns]
        
        for standard_col, variations in column_mapping.items():
            for variation in variations:
                if variation.lower() in columns_lower:
                    score += 10
                    break
        
        # Prefer sheets with more rows (likely to be transaction data)
        score += min(len(df), 100)  # Cap at 100 to avoid bias toward very large sheets
        
        # Prefer sheets with numeric columns (amounts)
        numeric_cols = df.select_dtypes(include=['number']).columns
        score += len(numeric_cols) * 5
        
        return score
    
    def _clean_merged_cells(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Handle merged cells in Excel by forward-filling values.
        
        Args:
            df: Input DataFrame
            
        Returns:
            Cleaned DataFrame
        """
        # Forward fill to handle merged cells
        df = df.fillna(method='ffill', axis=0)
        return df
