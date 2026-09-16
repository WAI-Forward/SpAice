$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$crazyGamesRoot = Join-Path $repoRoot "CrazyGames"
$staleZipPath = Join-Path $repoRoot "clusternauts-crazygames-upload.zip"

Push-Location $repoRoot
try {
  node scripts/build-platforms.js crazygames
  node tests/crazygames-package-smoke.test.js

  if (Test-Path $staleZipPath) {
    Remove-Item -LiteralPath $staleZipPath -Force
  }

  Write-Host "CrazyGames upload folder ready at CrazyGames/"
  Write-Host "Upload the contents of CrazyGames/ directly; do not zip or archive them."
}
finally {
  Pop-Location
}
