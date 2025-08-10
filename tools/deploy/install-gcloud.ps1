# Script de instalação do Google Cloud CLI para Windows
# Roteiro de Dispensação - Deploy para Cloud Run

Write-Host "=== Instalação do Google Cloud CLI ===" -ForegroundColor Cyan

# Verificar se já está instalado
if (Get-Command gcloud -ErrorAction SilentlyContinue) {
    Write-Host "Google Cloud CLI já está instalado!" -ForegroundColor Green
    gcloud --version
    exit 0
}

# Criar diretório temporário
$tempDir = "$env:TEMP\gcloud-install"
New-Item -ItemType Directory -Force -Path $tempDir
Set-Location $tempDir

# Download do instalador
Write-Host "Baixando Google Cloud CLI..." -ForegroundColor Yellow
$url = "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
$installer = "$tempDir\GoogleCloudSDKInstaller.exe"

try {
    Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing
    Write-Host "Download concluído!" -ForegroundColor Green
} catch {
    Write-Host "Erro no download: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Executar instalador
Write-Host "Executando instalador..." -ForegroundColor Yellow
Write-Host "IMPORTANTE: Durante a instalação:" -ForegroundColor Yellow
Write-Host "1. Marque 'Add gcloud to PATH'" -ForegroundColor Yellow
Write-Host "2. Marque 'Install Python 3.x'" -ForegroundColor Yellow
Write-Host "3. Clique em 'Finish' quando concluir" -ForegroundColor Yellow

Start-Process -FilePath $installer -Wait

# Verificar instalação
Write-Host "Verificando instalação..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Atualizar PATH na sessão atual
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")

if (Get-Command gcloud -ErrorAction SilentlyContinue) {
    Write-Host "Google Cloud CLI instalado com sucesso!" -ForegroundColor Green
    gcloud --version
    
    Write-Host "`n=== Próximos Passos ===" -ForegroundColor Cyan
    Write-Host "1. Execute: gcloud auth login" -ForegroundColor White
    Write-Host "2. Execute: gcloud config set project SEU_PROJECT_ID" -ForegroundColor White
    Write-Host "3. Execute: gcloud services enable run.googleapis.com" -ForegroundColor White
    Write-Host "4. Execute: gcloud services enable cloudbuild.googleapis.com" -ForegroundColor White
} else {
    Write-Host "Instalação falhou. Reinicie o terminal e tente novamente." -ForegroundColor Red
    Write-Host "Ou baixe manualmente de: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
}

# Limpeza
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue