# Script melhorado para corrigir TODAS as ocorrências de cores
$frontendPath = "apps\frontend-nextjs\src"

# Mapeamento de cores
$colorMap = @{
    "modernChatTheme.colors.status.success" = "#10B981"
    "modernChatTheme.colors.status.warning" = "#F59E0B" 
    "modernChatTheme.colors.status.error" = "#EF4444"
    "modernChatTheme.colors.status.info" = "#3B82F6"
}

# Buscar todos arquivos .tsx
$files = Get-ChildItem -Path $frontendPath -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    foreach ($oldColor in $colorMap.Keys) {
        $newColor = $colorMap[$oldColor]
        $oldColorEscaped = [regex]::Escape($oldColor)
        
        # Padrão 1: color: modernChatTheme.colors.status.success
        $pattern1 = "color:\s*$oldColorEscaped"
        if ($content -match $pattern1) {
            $content = $content -replace $pattern1, "color: '$newColor'"
            $modified = $true
            Write-Host "Fixed color pattern 1 in $($file.Name)"
        }
        
        # Padrão 2: background: modernChatTheme.colors.status.success (sem concatenação)
        $pattern2 = "background:\s*$oldColorEscaped(?![+\s]*['\`""])"
        if ($content -match $pattern2) {
            $content = $content -replace $pattern2, "background: '$newColor'"
            $modified = $true
            Write-Host "Fixed background pattern 2 in $($file.Name)"
        }
        
        # Padrão 3: modernChatTheme.colors.status.success + '20' (com concatenação)
        $pattern3 = "$oldColorEscaped\s*\+"
        if ($content -match $pattern3) {
            $content = $content -replace "$oldColorEscaped(?=\s*\+)", "'$newColor'"
            $modified = $true
            Write-Host "Fixed concatenation pattern 3 in $($file.Name)"
        }
        
        # Padrão 4: ? modernChatTheme.colors.status.success (ternário)
        $pattern4 = "\?\s*$oldColorEscaped"
        if ($content -match $pattern4) {
            $content = $content -replace "\?\s*$oldColorEscaped", "? '$newColor'"
            $modified = $true
            Write-Host "Fixed ternary pattern 4 in $($file.Name)"
        }
        
        # Padrão 5: : modernChatTheme.colors.status.success (ternário else)
        $pattern5 = ":\s*$oldColorEscaped"
        if ($content -match $pattern5) {
            $content = $content -replace ":\s*$oldColorEscaped", ": '$newColor'"
            $modified = $true
            Write-Host "Fixed ternary else pattern 5 in $($file.Name)"
        }
        
        # Padrão 6: = modernChatTheme.colors.status.success (atribuição)
        $pattern6 = "=\s*$oldColorEscaped(?![+\s]*['\`""])"
        if ($content -match $pattern6) {
            $content = $content -replace "=\s*$oldColorEscaped(?![+\s]*['\`""])", "= '$newColor'"
            $modified = $true
            Write-Host "Fixed assignment pattern 6 in $($file.Name)"
        }
    }
    
    if ($modified) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "Updated $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "All color fixing completed!" -ForegroundColor Yellow