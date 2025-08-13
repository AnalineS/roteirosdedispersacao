# Script para corrigir todos os erros de tipo de cor
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
        
        # Substituir em propriedades color:
        if ($content -match "color: $([regex]::Escape($oldColor))") {
            $content = $content -replace "color: $([regex]::Escape($oldColor))", "color: '$newColor'"
            $modified = $true
            Write-Host "Fixed color in $($file.Name)"
        }
        
        # Substituir em propriedades background: (apenas quando usado diretamente)
        if ($content -match "background: $([regex]::Escape($oldColor))(?![+0-9])") {
            $content = $content -replace "background: $([regex]::Escape($oldColor))(?![+0-9])", "background: '$newColor'"
            $modified = $true
            Write-Host "Fixed background in $($file.Name)"
        }
    }
    
    if ($modified) {
        Set-Content $file.FullName -Value $content
    }
}

Write-Host "Color fixing completed!"