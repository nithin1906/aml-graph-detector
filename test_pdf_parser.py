"""
Test script to verify PDF parser can handle bank statement format
"""
import sys
sys.path.append('backend')

from backend.parsers.pdf_parser import PDFParser

def test_pdf_parser():
    parser = PDFParser()
    
    try:
        print("Testing PDF parser with suspicious_bank_statement.pdf...")
        df = parser.parse("suspicious_bank_statement.pdf")
        
        print(f"\nSuccess! Parsed {len(df)} transactions")
        print(f"\nDataFrame columns: {list(df.columns)}")
        print(f"\nFirst few transactions:")
        print(df.head(10).to_string())
        
        print(f"\n\nTransaction summary:")
        print(f"- Total transactions: {len(df)}")
        print(f"- Unique accounts: {len(set(df['from_account'].unique()) | set(df['to_account'].unique()))}")
        print(f"- Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"- Total amount: ${df['amount'].sum():,.2f}")
        
        # Write to file for easier viewing
        with open('test_output.txt', 'w', encoding='utf-8') as f:
            f.write(f"Success! Parsed {len(df)} transactions\n\n")
            f.write(f"DataFrame columns: {list(df.columns)}\n\n")
            f.write("All transactions:\n")
            f.write(df.to_string())
            f.write(f"\n\nTransaction summary:\n")
            f.write(f"- Total transactions: {len(df)}\n")
            f.write(f"- Unique accounts: {len(set(df['from_account'].unique()) | set(df['to_account'].unique()))}\n")
            f.write(f"- Date range: {df['date'].min()} to {df['date'].max()}\n")
            f.write(f"- Total amount: ${df['amount'].sum():,.2f}\n")
        
        print("\nFull output written to test_output.txt")
        return True
    except Exception as e:
        print(f"\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_pdf_parser()
    sys.exit(0 if success else 1)
