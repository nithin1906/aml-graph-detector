"""
PDF parser for bank statements.
"""

import pandas as pd
import pdfplumber
from typing import List, Optional
from .base_parser import BaseParser
import re


class PDFParser(BaseParser):
    """Parser for PDF format bank statements."""
    
    def __init__(self):
        super().__init__()
    
    def parse(self, file_path: str) -> pd.DataFrame:
        """
        Parse PDF file and return standardized DataFrame.
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            Standardized DataFrame
        """
        try:
            # Extract tables from PDF
            tables = self._extract_tables(file_path)
            
            if not tables:
                raise ValueError("No tables found in PDF")
            
            # Find the best table (most likely to contain transactions)
            df = self._find_best_table(tables)
            
            if df is None or df.empty:
                raise ValueError("No valid transaction data found in PDF")
            
        except Exception as e:
            raise ValueError(f"Error reading PDF file: {str(e)}")
        
        # Map columns to standard names
        df = self.map_columns(df)
        
        # Check if this is a bank statement format (debit/credit columns)
        if 'debit' in df.columns or 'credit' in df.columns:
            df = self._convert_bank_statement_format(df)
        
        # Standardize the DataFrame
        df = self.standardize(df)
        
        # Validate
        is_valid, errors = self.validate(df)
        if not is_valid:
            raise ValueError(f"Validation errors: {', '.join(errors)}")
        
        return df
    
    def _extract_tables(self, file_path: str) -> List[pd.DataFrame]:
        """
        Extract all tables from PDF file.
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            List of DataFrames, one per table found
        """
        tables = []
        
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    # Extract tables from this page
                    page_tables = page.extract_tables()
                    
                    for table in page_tables:
                        if table and len(table) > 1:  # At least header + 1 row
                            # Convert to DataFrame
                            df = pd.DataFrame(table[1:], columns=table[0])
                            tables.append(df)
        except Exception as e:
            print(f"Error extracting tables: {str(e)}")
        
        return tables
    
    def _find_best_table(self, tables: List[pd.DataFrame]) -> Optional[pd.DataFrame]:
        """
        Find the table most likely to contain transaction data.
        
        Args:
            tables: List of DataFrames extracted from PDF
            
        Returns:
            Best DataFrame or None
        """
        if not tables:
            return None
        
        best_df = None
        best_score = 0
        
        for df in tables:
            score = self._score_table(df)
            if score > best_score:
                best_score = score
                best_df = df
        
        return best_df
    
    def _score_table(self, df: pd.DataFrame) -> int:
        """
        Score a table based on likelihood of containing transaction data.
        
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
                    score += 15
                    break
        
        # Prefer tables with more rows
        score += min(len(df), 50)
        
        # Check for numeric columns (amounts)
        for col in df.columns:
            if self._has_numeric_values(df[col]):
                score += 10
        
        # Check for date-like values
        for col in df.columns:
            if self._has_date_values(df[col]):
                score += 10
        
        return score
    
    def _has_numeric_values(self, series: pd.Series) -> bool:
        """Check if series contains numeric values."""
        try:
            # Try to convert to numeric
            numeric_series = pd.to_numeric(series.astype(str).str.replace(',', ''), errors='coerce')
            return numeric_series.notna().sum() > len(series) * 0.5  # At least 50% numeric
        except:
            return False
    
    def _has_date_values(self, series: pd.Series) -> bool:
        """Check if series contains date values."""
        try:
            # Try to convert to datetime
            date_series = pd.to_datetime(series, errors='coerce')
            return date_series.notna().sum() > len(series) * 0.5  # At least 50% dates
        except:
            return False
    
    def _convert_bank_statement_format(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Convert bank statement format (debit/credit columns) to transaction format.
        
        Args:
            df: DataFrame with debit/credit columns
            
        Returns:
            DataFrame with from_account/to_account columns
        """
        transactions = []
        
        # Try to extract account holder from description or use default
        account_holder = "ACCOUNT_HOLDER"
        
        for idx, row in df.iterrows():
            date = row.get('date', None)
            description = row.get('description', 'Unknown Transaction')
            debit = row.get('debit', 0)
            credit = row.get('credit', 0)
            
            # Clean debit/credit values - handle "-" or empty strings and currency symbols
            try:
                if pd.isna(debit) or debit == '-' or debit == '':
                    debit = 0
                else:
                    # Remove $, Rs., ₹ and commas
                    debit = str(debit).replace('$', '').replace('Rs.', '').replace('₹', '').replace(',', '').strip()
                    debit = float(debit) if debit else 0
            except (ValueError, AttributeError):
                debit = 0
            
            try:
                if pd.isna(credit) or credit == '-' or credit == '':
                    credit = 0
                else:
                    # Remove $, Rs., ₹ and commas
                    credit = str(credit).replace('$', '').replace('Rs.', '').replace('₹', '').replace(',', '').strip()
                    credit = float(credit) if credit else 0
            except (ValueError, AttributeError):
                credit = 0
            
            # Create transaction based on debit or credit
            if debit > 0:
                # Money going out: from account_holder to description
                transactions.append({
                    'date': date,
                    'from_account': account_holder,
                    'to_account': str(description),
                    'amount': debit,
                    'description': str(description)
                })
            elif credit > 0:
                # Money coming in: from description to account_holder
                transactions.append({
                    'date': date,
                    'from_account': str(description),
                    'to_account': account_holder,
                    'amount': credit,
                    'description': str(description)
                })
        
        # Convert to DataFrame
        result_df = pd.DataFrame(transactions)
        
        return result_df
    
    def _clean_pdf_text(self, text: str) -> str:
        """
        Clean extracted PDF text.
        
        Args:
            text: Raw text from PDF
            
        Returns:
            Cleaned text
        """
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters
        text = text.strip()
        return text
