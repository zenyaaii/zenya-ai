Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$sourceDirectory = "$PSScriptRoot\shopify-theme"
$zipFilePath = "$PSScriptRoot\zenya-theme-release.zip"

if (Test-Path $zipFilePath) { Remove-Item $zipFilePath }

Write-Host "Creating zip at $zipFilePath from $sourceDirectory"

$zip = [System.IO.Compression.ZipFile]::Open($zipFilePath, [System.IO.Compression.ZipArchiveMode]::Create)

$files = Get-ChildItem $sourceDirectory -Recurse -File

foreach ($file in $files) {
    # Calculate relative path
    # e.g. C:\Users\...\shopify-theme\layout\theme.liquid -> layout\theme.liquid
    $relativePath = $file.FullName.Substring($sourceDirectory.Length + 1)
    
    # Force forward slashes
    $entryName = $relativePath.Replace('\', '/')
    
    Write-Host "Adding $entryName"
    
    $entry = $zip.CreateEntry($entryName)
    $entryStream = $entry.Open()
    
    # Copy content
    $fileStream = [System.IO.File]::OpenRead($file.FullName)
    $fileStream.CopyTo($entryStream)
    
    $fileStream.Dispose()
    $entryStream.Dispose()
}

$zip.Dispose()
Write-Host "Zip created successfully."

# Verify content
Write-Host "`nVerifying Zip Content:"
$zipCheck = [System.IO.Compression.ZipFile]::OpenRead($zipFilePath)
foreach ($entry in $zipCheck.Entries) {
    Write-Host "- $($entry.FullName)"
}
$zipCheck.Dispose()

Write-Host "`n[SUCCESS] Theme zip created: $zipFilePath"
Write-Host "Please upload this file to Shopify."
