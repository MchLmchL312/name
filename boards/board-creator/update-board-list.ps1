param([string]$BoardsDir = (Join-Path $PSScriptRoot "..\boards"))

$ErrorActionPreference = "Stop"
$BoardsDir = [System.IO.Path]::GetFullPath($BoardsDir)
$files = @(Get-ChildItem -LiteralPath $BoardsDir -File -Filter "board*.jpg" |
  Where-Object { $_.Name -cmatch "^board[1-9][0-9]*\.jpg$" } |
  Sort-Object { [int]($_.BaseName.Substring(5)) })
$data = [ordered]@{ boards = @($files | ForEach-Object { $_.Name }) }
$json = $data | ConvertTo-Json -Depth 3
$target = Join-Path $BoardsDir "boards.json"
$temporary = Join-Path $BoardsDir ("boards-" + [guid]::NewGuid().ToString("N") + ".tmp")

# Replace the complete list at once so the gallery never reads partial JSON.
try {
  [System.IO.File]::WriteAllText($temporary, $json, (New-Object System.Text.UTF8Encoding($false)))
  if ([System.IO.File]::Exists($target)) {
    [System.IO.File]::Replace($temporary, $target, [NullString]::Value)
  }
  else {
    [System.IO.File]::Move($temporary, $target)
  }
}
finally {
  if ([System.IO.File]::Exists($temporary)) {
    [System.IO.File]::Delete($temporary)
  }
}
