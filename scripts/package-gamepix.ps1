$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$gamePixRoot = Join-Path $repoRoot "GamePix"
$zipPath = Join-Path $gamePixRoot "build.zip"
$staleZipPath = Join-Path $repoRoot "clusternauts-gamepix-upload.zip"

Push-Location $repoRoot
try {
  if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }

  node scripts/build-platforms.js gamepix

  if (Test-Path $staleZipPath) {
    Remove-Item -LiteralPath $staleZipPath -Force
  }

  $buildEntries = Get-ChildItem -LiteralPath $gamePixRoot -Force | Where-Object { $_.Name -ne "build.zip" }
  if (-not $buildEntries) {
    throw "GamePix build folder is empty."
  }

  Add-Type -AssemblyName System.IO.Compression
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zipArchive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    $buildRootFull = (Resolve-Path $gamePixRoot).Path.TrimEnd("\", "/")
    Get-ChildItem -LiteralPath $gamePixRoot -Recurse -File | Where-Object { $_.FullName -ne $zipPath } | ForEach-Object {
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
  node tests/gamepix-package-smoke.test.js

  Write-Host "GamePix upload folder ready at GamePix/"
  Write-Host "GamePix upload zip ready at GamePix/build.zip"
}
finally {
  Pop-Location
}
