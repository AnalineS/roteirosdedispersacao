# Script simples para corrigir cores restantes
$frontendPath = "apps\frontend-nextjs\src"

# Buscar todos arquivos .tsx
$files = Get-ChildItem -Path $frontendPath -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Substituições simples e específicas
    $replacements = @{
        "modernChatTheme.colors.status.success" = "'#10B981'"
        "modernChatTheme.colors.status.warning" = "'#F59E0B'"
        "modernChatTheme.colors.status.error" = "'#EF4444'"
        "modernChatTheme.colors.status.info" = "'#3B82F6'"
    }
    
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        if ($content.Contains($old)) {
            $content = $content.Replace($old, $new)
            $modified = $true
            Write-Host "Replaced $old in $($file.Name)"
        }
    }
    
    if ($modified) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "Simple color fixing completed!" -ForegroundColor Yellow