"""
CSV parser for bank statements.
"""

import pandas as pd
from typing import List
from .base_parser import BaseParser


class CSVParser(BaseParser):
    """Parser for CSV format bank statements."""
    
    def __init__(self):
        super().__init__()
        self.supported_delimiters = [',', ';', '\t', '|']
    
    def parse(self, file_path: str) -> pd.DataFrame:
        """
        Parse CSV file and return standardized DataFrame.
        
        Args:
            file_path: Path to CSV file
            
        Returns:
            Standardized DataFrame
        """
        # Try different delimiters
        df = None
        for delimiter in self.supported_delimiters:
            try:
                df = pd.read_csv(file_path, delimiter=delimiter)
                if len(df.columns) > 1:  # Valid if more than 1 column
                    break
            except Exception:
                continue
        
        if df is None or df.empty:
            raise ValueError("Could not parse CSV file with any supported delimiter")
        
        # Map columns to standard names
        df = self.map_columns(df)
        
        # Standardize the DataFrame
        df = self.standardize(df)
        
        # Validate
        is_valid, errors = self.validate(df)
        if not is_valid:
            raise ValueError(f"Validation errors: {', '.join(errors)}")
        
        return df
    
    def detect_delimiter(self, file_path: str) -> str:
        """
        Detect the delimiter used in the CSV file.
        
        Args:
            file_path: Path to CSV file
            
        Returns:
            Detected delimiter character
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            first_line = f.readline()
        
        delimiter_counts = {delim: first_line.count(delim) for delim in self.supported_delimiters}
        return max(delimiter_counts, key=delimiter_counts.get)
