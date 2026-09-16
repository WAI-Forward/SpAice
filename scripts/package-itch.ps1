$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$itchRoot = Join-Path $repoRoot "Itch"
$itchBuildRoot = Join-Path $itchRoot "build"
$zipPath = Join-Path $itchRoot "clusternauts-itch.zip"

Push-Location $repoRoot
try {
  if (Test-Path $itchBuildRoot) {
    Remove-Item -LiteralPath $itchBuildRoot -Recurse -Force
  }

  node scripts/build-platforms.js itch
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }

  New-Item -ItemType Directory -Force -Path $itchRoot | Out-Null
  Add-Type -AssemblyName System.IO.Compression
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zipArchive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    $buildEntries = Get-ChildItem -LiteralPath $itchBuildRoot -Force
    if (-not $buildEntries) {
      throw "Itch build folder is empty."
    }
    $buildRootFull = (Resolve-Path $itchBuildRoot).Path.TrimEnd("\", "/")
    Get-ChildItem -LiteralPath $itchBuildRoot -Recurse -File | ForEach-Object {
      $relativePath = $_.FullName.Substring($buildRootFull.Length).TrimStart("\", "/").Replace("\", "/")
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $zipArchive,
        $_.FullName,
        $relativePath,
        [System.IO.Compression.CompressionLevel]::Optimal
      ) | Out-Null
    }
  }
  finally {
    $zipArchive.Dispose()
  }

  node tests/itch-package-smoke.test.js
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  Write-Host "Itch upload zip ready at Itch/clusternauts-itch.zip"
  Write-Host "Upload that zip to itch.io as an HTML game; it contains index.html at the zip root."
}
finally {
  Pop-Location
}
