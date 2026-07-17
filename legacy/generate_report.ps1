# generate_report.ps1
# Scans a folder of per-asset log files (one .log per asset, last line = latest
# check) and writes a CSV summary. Scheduled task runs this nightly. Nobody's
# touched it since it was written - included here only so the modernization
# tool can produce a migration PLAN for it (not a working rewrite - see README).

$logDir = "C:\AssetLogs"
$outFile = "C:\Reports\asset_summary.csv"
$results = @()

Get-ChildItem -Path $logDir -Filter "*.log" | ForEach-Object {
    $assetId = $_.BaseName
    $lines = Get-Content $_.FullName
    $lastLine = $lines[$lines.Count - 1]
    $parts = $lastLine -split ","
    $checkedDate = $parts[0]
    $status = $parts[1]

    $obj = New-Object PSObject
    $obj | Add-Member -Type NoteProperty -Name "AssetId" -Value $assetId
    $obj | Add-Member -Type NoteProperty -Name "LastChecked" -Value $checkedDate
    $obj | Add-Member -Type NoteProperty -Name "Status" -Value $status
    $results += $obj
}

$results | Export-Csv -Path $outFile -NoTypeInformation
Write-Host "Wrote $($results.Count) rows to $outFile"
