
$sectionsDir = "c:\Users\musannef\zenya 2\shopify-theme\sections"
$files = Get-ChildItem -Path $sectionsDir -Filter "*.liquid"

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match '"presets"\s*:\s*\[([\s\S]*?)\]') {
        $presetsBlock = $matches[1]
        $matches2 = [regex]::Matches($presetsBlock, '"name"\s*:\s*"([^"]+)"')
        foreach ($match in $matches2) {
            $presetName = $match.Groups[1].Value
            Write-Host "FOUND: File: $($file.Name) - Preset: '$presetName'"
        }
    }
}
