# Test fraud detection with the generated fraudulent statement
Write-Host "=== Testing AML Fraud Detection ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload the fraudulent statement
Write-Host "Step 1: Uploading fraudulent bank statement..." -ForegroundColor Yellow
$filePath = "suspicious_bank_statement_inr.pdf"
$uploadUri = "http://localhost:8000/api/upload-statement"

if (-not (Test-Path $filePath)) {
    Write-Host "Error: File not found - $filePath" -ForegroundColor Red
    exit 1
}

$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$fileEnc = [System.Text.Encoding]::GetEncoding('ISO-8859-1').GetString($fileBytes)
$boundary = [System.Guid]::NewGuid().ToString()

$LF = "`r`n"
$bodyLines = (
    "--$boundary",
    'Content-Disposition: form-data; name="file"; filename="suspicious_bank_statement_inr.pdf"',
    "Content-Type: application/pdf$LF",
    $fileEnc,
    "--$boundary--$LF"
) -join $LF

try {
    $uploadResponse = Invoke-WebRequest -Uri $uploadUri -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines
    $uploadData = $uploadResponse.Content | ConvertFrom-Json
    
    Write-Host "Upload successful!" -ForegroundColor Green
    Write-Host "  Upload ID: $($uploadData.upload_id)" -ForegroundColor Gray
    Write-Host "  Transactions: $($uploadData.transaction_count)" -ForegroundColor Gray
    Write-Host ""
    
    # Step 2: Analyze the statement
    Write-Host "Step 2: Analyzing for fraud patterns..." -ForegroundColor Yellow
    $analyzeUri = "http://localhost:8000/api/analyze-statement/$($uploadData.upload_id)"
    
    $analyzeResponse = Invoke-WebRequest -Uri $analyzeUri -Method Post
    $analysisData = $analyzeResponse.Content | ConvertFrom-Json
    
    Write-Host "Analysis complete!" -ForegroundColor Green
    Write-Host ""
    
    # Display results
    Write-Host "=== FRAUD DETECTION RESULTS ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Overall Risk Score: " -NoNewline
    $riskScore = [math]::Round($analysisData.overall_risk_score * 100, 2)
    if ($riskScore -gt 70) {
        Write-Host "$riskScore% (HIGH RISK)" -ForegroundColor Red
    } elseif ($riskScore -gt 40) {
        Write-Host "$riskScore% (MEDIUM RISK)" -ForegroundColor Yellow
    } else {
        Write-Host "$riskScore% (LOW RISK)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Suspicious Transactions: $($analysisData.suspicious_transactions_count)" -ForegroundColor Yellow
    Write-Host "Suspicious Accounts: $($analysisData.suspicious_accounts_count)" -ForegroundColor Yellow
    Write-Host "Circular Patterns: $($analysisData.circular_patterns_count)" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Risk Breakdown:" -ForegroundColor Cyan
    foreach ($key in $analysisData.risk_breakdown.PSObject.Properties.Name) {
        $value = [math]::Round($analysisData.risk_breakdown.$key * 100, 2)
        Write-Host "  $key : $value%" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Test completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        Write-Host $reader.ReadToEnd() -ForegroundColor Red
    }
    exit 1
}
