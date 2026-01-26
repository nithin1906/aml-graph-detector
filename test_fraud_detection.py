import requests
import os

# Test uploading the generated fraudulent statement
pdf_path = "suspicious_bank_statement_inr.pdf"

if not os.path.exists(pdf_path):
    print(f"❌ PDF file not found: {pdf_path}")
    exit(1)

print(f"📤 Uploading {pdf_path}...")

# Upload the statement
with open(pdf_path, 'rb') as f:
    files = {'file': (pdf_path, f, 'application/pdf')}
    response = requests.post('http://localhost:8000/api/upload-statement', files=files)

if response.status_code == 200:
    result = response.json()
    print(f"✅ Upload successful!")
    print(f"   Upload ID: {result['upload_id']}")
    print(f"   Transactions: {result['transaction_count']}")
    
    upload_id = result['upload_id']
    
    # Analyze the statement
    print(f"\n🔍 Analyzing statement...")
    analysis_response = requests.post(f'http://localhost:8000/api/analyze-statement/{upload_id}')
    
    if analysis_response.status_code == 200:
        analysis = analysis_response.json()
        print(f"✅ Analysis complete!")
        print(f"\n📊 RESULTS:")
        print(f"   Overall Risk Score: {analysis['overall_risk_score']:.2%}")
        print(f"   Suspicious Transactions: {analysis['suspicious_transactions_count']}")
        print(f"   Suspicious Accounts: {analysis['suspicious_accounts_count']}")
        print(f"   Circular Patterns: {analysis['circular_patterns_count']}")
        print(f"\n🎯 Risk Breakdown:")
        for key, value in analysis['risk_breakdown'].items():
            print(f"   {key}: {value:.2%}")
        
        # Get detailed results
        analysis_id = analysis['analysis_id']
        details_response = requests.get(f'http://localhost:8000/api/analysis-results/{analysis_id}')
        
        if details_response.status_code == 200:
            details = details_response.json()
            print(f"\n🚨 Top Suspicious Accounts:")
            for acc in details['results']['suspicious_accounts'][:5]:
                print(f"   - {acc['account_id']}: Risk {acc['risk_score']:.2%}")
                print(f"     Reason: {acc['reason']}")
            
            print(f"\n💰 Top Suspicious Transactions:")
            for txn in details['results']['suspicious_transactions'][:5]:
                print(f"   - Rs.{txn['amount']:,.2f} from {txn['from_account']} to {txn['to_account']}")
                print(f"     Risk: {txn['risk_score']:.2%} - {', '.join(txn['reasons'])}")
    else:
        print(f"❌ Analysis failed: {analysis_response.text}")
else:
    print(f"❌ Upload failed: {response.text}")
