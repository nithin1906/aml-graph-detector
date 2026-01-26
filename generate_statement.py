from fpdf import FPDF
import random
from datetime import datetime, timedelta

class BankStatementPDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, 'State Bank of India - Monthly Statement', 0, 1, 'C')
        self.set_font('Arial', 'I', 10)
        self.cell(0, 10, 'Statement Period: Nov 01 2025 - Nov 30 2025', 0, 1, 'C')
        self.set_font('Arial', '', 9)
        self.cell(0, 10, 'Account Number: XXXX-XXXX-1234 | Currency: INR', 0, 1, 'C')
        self.ln(5)
        
        # Table Header
        self.set_font('Arial', 'B', 10)
        self.set_fill_color(200, 220, 255)
        self.cell(30, 10, 'Date', 1, 0, 'C', 1)
        self.cell(80, 10, 'Description', 1, 0, 'C', 1)
        self.cell(30, 10, 'Debit (-)', 1, 0, 'C', 1)
        self.cell(30, 10, 'Credit (+)', 1, 0, 'C', 1)
        self.cell(25, 10, 'Balance', 1, 1, 'C', 1)

    def add_transaction(self, date, desc, debit, credit, balance):
        self.set_font('Arial', '', 9)
        self.cell(30, 10, date, 1)
        self.cell(80, 10, desc, 1)
        
        # Formatting amounts with INR symbol
        debit_str = f"Rs.{debit:,.2f}" if debit > 0 else "-"
        credit_str = f"Rs.{credit:,.2f}" if credit > 0 else "-"
        
        self.cell(30, 10, debit_str, 1, 0, 'R')
        self.cell(30, 10, credit_str, 1, 0, 'R')
        self.cell(25, 10, f"Rs.{balance:,.2f}", 1, 1, 'R')

def generate_fraud_data():
    pdf = BankStatementPDF()
    pdf.add_page()
    
    balance = 50000.00  # Starting balance in INR
    current_date = datetime(2025, 11, 1)
    
    transactions = []

    # 1. Normal Random Transactions (Noise)
    normal_merchants = [
        "SWIGGY FOOD ORDER", "UBER RIDE", "FLIPKART PURCHASE", 
        "NETFLIX SUBSCRIPTION", "DMart GROCERY", "PETROL PUMP",
        "CAFE COFFEE DAY", "BOOK MY SHOW"
    ]
    for _ in range(8):
        amount = random.uniform(150, 2500)
        transactions.append({
            "date": current_date + timedelta(days=random.randint(1, 6)),
            "desc": random.choice(normal_merchants),
            "debit": amount,
            "credit": 0
        })

    # --- FRAUD PATTERN 1: STRUCTURING (Smurfing) ---
    # Multiple deposits just under Rs.10 Lakh threshold to avoid reporting
    fraud_date = datetime(2025, 11, 10)
    for i in range(4):
        amount = random.uniform(850000, 990000)  # Just under 10L
        transactions.append({
            "date": fraud_date + timedelta(hours=i*3),
            "desc": f"CASH DEPOSIT ATM #{random.randint(1000, 9999)}",
            "debit": 0,
            "credit": amount,
            "is_fraud": True
        })

    # --- FRAUD PATTERN 2: RAPID LAYERING (Mule Account) ---
    # Large sum in, large sum out within hours
    layer_date = datetime(2025, 11, 15)
    transactions.append({
        "date": layer_date,
        "desc": "RTGS FROM SHELL ENTERPRISES PVT LTD",
        "debit": 0,
        "credit": 5000000.00,  # 50 Lakh
        "is_fraud": True
    })
    transactions.append({
        "date": layer_date + timedelta(hours=1),
        "desc": "NEFT TO OFFSHORE TRADING LLC",
        "debit": 4950000.00,  # Keeping 50k as 'commission'
        "credit": 0,
        "is_fraud": True
    })

    # --- FRAUD PATTERN 3: CIRCULAR TRADING ---
    # A -> B -> C -> A pattern (same amounts moving in circle)
    circle_date = datetime(2025, 11, 20)
    circle_amount = 1500000.00  # 15 Lakh
    
    transactions.append({
        "date": circle_date,
        "desc": "IMPS TO RAJESH KUMAR A/C 4521",
        "debit": circle_amount,
        "credit": 0,
        "is_fraud": True
    })
    transactions.append({
        "date": circle_date + timedelta(hours=6),
        "desc": "IMPS FROM PRIYA SHARMA A/C 7823",
        "debit": 0,
        "credit": circle_amount - 5000,  # Small fee deducted
        "is_fraud": True
    })

    # --- FRAUD PATTERN 4: ROUND NUMBER SUSPICIOUS TRANSACTIONS ---
    # Exactly round numbers are suspicious
    round_date = datetime(2025, 11, 25)
    transactions.append({
        "date": round_date,
        "desc": "UPI FROM UNKNOWN MERCHANT",
        "debit": 0,
        "credit": 500000.00,  # Exactly 5 Lakh
        "is_fraud": True
    })
    transactions.append({
        "date": round_date + timedelta(hours=2),
        "desc": "UPI TO CRYPTO EXCHANGE",
        "debit": 500000.00,
        "credit": 0,
        "is_fraud": True
    })

    # --- FRAUD PATTERN 5: HIGH FREQUENCY TRADING ---
    # Multiple large transactions in short time
    hft_date = datetime(2025, 11, 28)
    for i in range(5):
        amount = random.uniform(200000, 400000)
        transactions.append({
            "date": hft_date + timedelta(minutes=i*15),
            "desc": f"RTGS {'TO' if i % 2 == 0 else 'FROM'} TRADING ACCOUNT {random.randint(1000, 9999)}",
            "debit": amount if i % 2 == 0 else 0,
            "credit": 0 if i % 2 == 0 else amount,
            "is_fraud": True
        })

    # --- FRAUD PATTERN 6: SCATTER-GATHER (Hub & Spoke) ---
    # One large receipt scattered to 6 different people
    scatter_date = datetime(2025, 11, 29)
    # Receive large fund
    transactions.append({
        "date": scatter_date,
        "desc": "MAIN FUND INFLOW FROM SHELL CORP",
        "debit": 0,
        "credit": 6000000.00, # 60 Lakhs
        "is_fraud": True
    })
    # Scatter it
    recipients = ["ALIA", "BOB", "CHARLIE", "DAVE", "EVE", "FRANK"]
    for i, name in enumerate(recipients):
        transactions.append({
            "date": scatter_date + timedelta(minutes=30 + i*10),
            "desc": f"NEFT TRANSFER TO {name}",
            "debit": 950000.00, # Just under 10L each
            "credit": 0,
            "is_fraud": True
        })

    # Sort by date
    transactions.sort(key=lambda x: x['date'])

    # Write to PDF
    for t in transactions:
        # Update balance
        if t['credit'] > 0: balance += t['credit']
        if t['debit'] > 0: balance -= t['debit']
        
        pdf.add_transaction(
            t['date'].strftime("%Y-%m-%d"),
            t['desc'],
            t['debit'],
            t['credit'],
            balance
        )

    pdf.output("complex_laundering.pdf")
    print("✅ PDF Generated: complex_laundering.pdf")
    print("ℹ️  Currency: INR (₹)")
    print("ℹ️  Fraud Patterns Included:")
    print("   1. Structuring: 4 deposits just under ₹10L threshold")
    print("   2. Layering: ₹50L in, ₹49.5L out within 1 hour")
    print("   3. Circular Trading: ₹15L moving in circle")
    print("   4. Scatter-Gather: ₹60L dispersed to 6 mules")
    print(f"   Total Transactions: {len(transactions)}")

if __name__ == "__main__":
    generate_fraud_data()
