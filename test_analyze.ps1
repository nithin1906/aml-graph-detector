$uploadId = "a78c1901-ce41-47b8-b8d1-f71e39c4b1f5"
$uri = "http://localhost:8000/api/analyze-statement/$uploadId"

try {
    $response = Invoke-WebRequest -Uri $uri -Method Post
    Write-Host "Success!"
    Write-Host $response.Content
} catch {
    Write-Host "Error:"
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response Body:"
        Write-Host $errorBody
    }
}
