"""
Statement validator for checking parsed data quality.
"""

import pandas as pd
from typing import List, Tuple, Dict
from datetime import datetime


class StatementValidator:
    """Validates parsed bank statement data."""
    
    @staticmethod
    def validate_statement(df: pd.DataFrame) -> Tuple[bool, List[str], Dict[str, any]]:
        """
        Comprehensive validation of statement data.
        
        Args:
            df: Parsed DataFrame
            
        Returns:
            Tuple of (is_valid, errors, statistics)
        """
        errors = []
        stats = {}
        
        # Check if DataFrame is empty
        if df.empty:
            errors.append("Statement contains no transactions")
            return False, errors, stats
        
        # Validate required columns
        required_cols = ['date', 'from_account', 'to_account', 'amount']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {missing_cols}")
        
        # Validate dates
        date_errors = StatementValidator._validate_dates(df)
        errors.extend(date_errors)
        
        # Validate amounts
        amount_errors = StatementValidator._validate_amounts(df)
        errors.extend(amount_errors)
        
        # Validate accounts
        account_errors = StatementValidator._validate_accounts(df)
        errors.extend(account_errors)
        
        # Calculate statistics
        stats = StatementValidator._calculate_statistics(df)
        
        is_valid = len(errors) == 0
        return is_valid, errors, stats
    
    @staticmethod
    def _validate_dates(df: pd.DataFrame) -> List[str]:
        """Validate date column."""
        errors = []
        
        if 'date' not in df.columns:
            return errors
        
        # Check for null dates
        null_count = df['date'].isna().sum()
        if null_count > 0:
            errors.append(f"{null_count} transactions have missing dates")
        
        # Check date range
        try:
            min_date = df['date'].min()
            max_date = df['date'].max()
            
            if pd.notna(min_date) and pd.notna(max_date):
                date_range = (max_date - min_date).days
                if date_range > 3650:  # More than 10 years
                    errors.append(f"Date range seems unusually large: {date_range} days")
        except Exception as e:
            errors.append(f"Error validating date range: {str(e)}")
        
        return errors
    
    @staticmethod
    def _validate_amounts(df: pd.DataFrame) -> List[str]:
        """Validate amount column."""
        errors = []
        
        if 'amount' not in df.columns:
            return errors
        
        # Check for null amounts
        null_count = df['amount'].isna().sum()
        if null_count > 0:
            errors.append(f"{null_count} transactions have missing amounts")
        
        # Check for negative amounts
        negative_count = (df['amount'] < 0).sum()
        if negative_count > 0:
            errors.append(f"{negative_count} transactions have negative amounts")
        
        # Check for zero amounts
        zero_count = (df['amount'] == 0).sum()
        if zero_count > 0:
            errors.append(f"{zero_count} transactions have zero amounts")
        
        # Check for unrealistic amounts
        if df['amount'].max() > 1_000_000_000:  # 1 billion
            errors.append("Some amounts seem unrealistically large")
        
        return errors
    
    @staticmethod
    def _validate_accounts(df: pd.DataFrame) -> List[str]:
        """Validate account columns."""
        errors = []
        
        # Check from_account
        if 'from_account' in df.columns:
            null_count = df['from_account'].isna().sum()
            if null_count > 0:
                errors.append(f"{null_count} transactions have missing sender accounts")
        
        # Check to_account
        if 'to_account' in df.columns:
            null_count = df['to_account'].isna().sum()
            if null_count > 0:
                errors.append(f"{null_count} transactions have missing receiver accounts")
        
        # Check for self-transfers
        if 'from_account' in df.columns and 'to_account' in df.columns:
            self_transfer_count = (df['from_account'] == df['to_account']).sum()
            if self_transfer_count > 0:
                errors.append(f"{self_transfer_count} self-transfers detected")
        
        return errors
    
    @staticmethod
    def _calculate_statistics(df: pd.DataFrame) -> Dict[str, any]:
        """Calculate statement statistics."""
        stats = {
            'total_transactions': len(df),
            'unique_accounts': 0,
            'date_range': None,
            'total_amount': 0,
            'avg_amount': 0,
            'min_amount': 0,
            'max_amount': 0
        }
        
        # Account statistics
        if 'from_account' in df.columns and 'to_account' in df.columns:
            all_accounts = set(df['from_account'].unique()) | set(df['to_account'].unique())
            stats['unique_accounts'] = len(all_accounts)
        
        # Date statistics
        if 'date' in df.columns:
            try:
                min_date = df['date'].min()
                max_date = df['date'].max()
                if pd.notna(min_date) and pd.notna(max_date):
                    stats['date_range'] = {
                        'start': min_date.strftime('%Y-%m-%d'),
                        'end': max_date.strftime('%Y-%m-%d'),
                        'days': (max_date - min_date).days
                    }
            except:
                pass
        
        # Amount statistics
        if 'amount' in df.columns:
            try:
                stats['total_amount'] = float(df['amount'].sum())
                stats['avg_amount'] = float(df['amount'].mean())
                stats['min_amount'] = float(df['amount'].min())
                stats['max_amount'] = float(df['amount'].max())
            except:
                pass
        
        return stats
