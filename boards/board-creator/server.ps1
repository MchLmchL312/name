param(
  [int]$PreferredPort = 8765,
  [string]$BoardsDir = "",
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($BoardsDir)) {
  $BoardsDir = Join-Path $AppRoot "..\boards"
}

$BoardsDir = [System.IO.Path]::GetFullPath($BoardsDir)
if (-not (Test-Path -LiteralPath $BoardsDir -PathType Container)) {
  throw "Boards map niet gevonden: $BoardsDir"
}

$BoardWidth = 1200
$BoardHeight = 900
$MaxPayloadBytes = 30MB

Add-Type -AssemblyName System.Drawing

function Get-NextBoardInfo {
  $max = 0
  Get-ChildItem -LiteralPath $BoardsDir -File -Filter "board*.jpg" | ForEach-Object {
    if ($_.BaseName -match "^board(\d+)$") {
      $number = [int]$Matches[1]
      if ($number -gt $max) {
        $max = $number
      }
    }
  }

  $nextNumber = $max + 1
  [pscustomobject]@{
    number = $nextNumber
    name = "board$nextNumber.jpg"
    path = (Join-Path $BoardsDir "board$nextNumber.jpg")
  }
}

function Send-Bytes {
  param(
    [System.Net.HttpListenerResponse]$Response,
    [byte[]]$Bytes,
    [string]$ContentType,
    [int]$StatusCode = 200
  )

  $Response.StatusCode = $StatusCode
  $Response.ContentType = $ContentType
  $Response.ContentLength64 = $Bytes.Length
  $Response.Headers["Cache-Control"] = "no-store"
  $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
  $Response.OutputStream.Close()
}

function Send-Json {
  param(
    [System.Net.HttpListenerResponse]$Response,
    [object]$Data,
    [int]$StatusCode = 200
  )

  $json = $Data | ConvertTo-Json -Depth 8
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  Send-Bytes -Response $Response -Bytes $bytes -ContentType "application/json; charset=utf-8" -StatusCode $StatusCode
}

function Send-TextError {
  param(
    [System.Net.HttpListenerResponse]$Response,
    [string]$Message,
    [int]$StatusCode = 500
  )

  Send-Json -Response $Response -StatusCode $StatusCode -Data ([pscustomobject]@{
    ok = $false
    error = $Message
  })
}

function Get-ContentType {
  param([string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8"; break }
    ".css" { "text/css; charset=utf-8"; break }
    ".js" { "application/javascript; charset=utf-8"; break }
    ".json" { "application/json; charset=utf-8"; break }
    ".jpg" { "image/jpeg"; break }
    ".jpeg" { "image/jpeg"; break }
    ".png" { "image/png"; break }
    ".svg" { "image/svg+xml"; break }
    ".ico" { "image/x-icon"; break }
    default { "application/octet-stream" }
  }
}

function Assert-BoardImage {
  param([byte[]]$Bytes)

  $memory = New-Object System.IO.MemoryStream(,$Bytes)
  try {
    $image = [System.Drawing.Image]::FromStream($memory)
    try {
      if ($image.Width -ne $BoardWidth -or $image.Height -ne $BoardHeight) {
        throw "Afbeelding is $($image.Width)x$($image.Height), verwacht ${BoardWidth}x${BoardHeight}."
      }
    }
    finally {
      $image.Dispose()
    }
  }
  finally {
    $memory.Dispose()
  }
}

function Save-Board {
  param([byte[]]$Bytes)

  Assert-BoardImage -Bytes $Bytes

  for ($i = 0; $i -lt 1000; $i++) {
    $next = Get-NextBoardInfo
    try {
      $stream = [System.IO.File]::Open($next.path, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
      try {
        $stream.Write($Bytes, 0, $Bytes.Length)
      }
      finally {
        $stream.Dispose()
      }

      return [pscustomobject]@{
        ok = $true
        number = $next.number
        name = $next.name
        path = $next.path
        bytes = $Bytes.Length
      }
    }
    catch [System.IO.IOException] {
      continue
    }
  }

  throw "Geen vrij boardnummer gevonden."
}

function Handle-Status {
  param([System.Net.HttpListenerResponse]$Response)

  $next = Get-NextBoardInfo
  Send-Json -Response $Response -Data ([pscustomobject]@{
    ok = $true
    nextNumber = $next.number
    nextName = $next.name
    width = $BoardWidth
    height = $BoardHeight
    boardsDir = $BoardsDir
  })
}

function Handle-Save {
  param(
    [System.Net.HttpListenerRequest]$Request,
    [System.Net.HttpListenerResponse]$Response
  )

  if ($Request.ContentLength64 -gt $MaxPayloadBytes) {
    Send-TextError -Response $Response -StatusCode 413 -Message "Bestand is te groot."
    return
  }

  $reader = New-Object System.IO.StreamReader($Request.InputStream, $Request.ContentEncoding)
  try {
    $body = $reader.ReadToEnd()
  }
  finally {
    $reader.Dispose()
  }

  $payload = $body | ConvertFrom-Json
  $dataUrl = [string]$payload.image
  $prefix = "data:image/jpeg;base64,"

  if ([string]::IsNullOrWhiteSpace($dataUrl) -or -not $dataUrl.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    Send-TextError -Response $Response -StatusCode 400 -Message "Ongeldige JPG data."
    return
  }

  $base64 = $dataUrl.Substring($prefix.Length)
  $bytes = [System.Convert]::FromBase64String($base64)
  $result = Save-Board -Bytes $bytes
  $next = Get-NextBoardInfo

  $result | Add-Member -NotePropertyName nextName -NotePropertyValue $next.name
  $result | Add-Member -NotePropertyName width -NotePropertyValue $BoardWidth
  $result | Add-Member -NotePropertyName height -NotePropertyValue $BoardHeight
  Send-Json -Response $Response -Data $result
}

function Handle-Static {
  param(
    [System.Net.HttpListenerRequest]$Request,
    [System.Net.HttpListenerResponse]$Response
  )

  $urlPath = [System.Uri]::UnescapeDataString($Request.Url.AbsolutePath)
  if ($urlPath -eq "/" -or [string]::IsNullOrWhiteSpace($urlPath)) {
    $urlPath = "/index.html"
  }

  $relative = $urlPath.TrimStart("/") -replace "/", [System.IO.Path]::DirectorySeparatorChar
  $target = [System.IO.Path]::GetFullPath((Join-Path $AppRoot $relative))
  $root = [System.IO.Path]::GetFullPath($AppRoot).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

  if (-not $target.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    Send-TextError -Response $Response -StatusCode 403 -Message "Pad niet toegestaan."
    return
  }

  if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
    Send-TextError -Response $Response -StatusCode 404 -Message "Bestand niet gevonden."
    return
  }

  $bytes = [System.IO.File]::ReadAllBytes($target)
  Send-Bytes -Response $Response -Bytes $bytes -ContentType (Get-ContentType -Path $target)
}

function Start-BoardCreatorServer {
  $listener = $null
  $baseUrl = $null

  for ($port = $PreferredPort; $port -lt ($PreferredPort + 30); $port++) {
    $candidate = New-Object System.Net.HttpListener
    $prefix = "http://127.0.0.1:$port/"
    $candidate.Prefixes.Add($prefix)

    try {
      $candidate.Start()
      $listener = $candidate
      $baseUrl = $prefix
      break
    }
    catch {
      $candidate.Close()
    }
  }

  if ($null -eq $listener) {
    throw "Geen vrije lokale poort gevonden vanaf $PreferredPort."
  }

  Write-Host ""
  Write-Host "Board Creator draait op $baseUrl"
  Write-Host "Opslaan naar: $BoardsDir"
  Write-Host "Sluit dit venster om de app te stoppen."
  Write-Host ""

  if (-not $NoBrowser) {
    Start-Process $baseUrl
  }

  try {
    while ($listener.IsListening) {
      $context = $listener.GetContext()
      try {
        $request = $context.Request
        $response = $context.Response

        if ($request.HttpMethod -eq "GET" -and $request.Url.AbsolutePath -eq "/api/status") {
          Handle-Status -Response $response
        }
        elseif ($request.HttpMethod -eq "POST" -and $request.Url.AbsolutePath -eq "/api/save") {
          Handle-Save -Request $request -Response $response
        }
        elseif ($request.HttpMethod -eq "GET") {
          Handle-Static -Request $request -Response $response
        }
        else {
          Send-TextError -Response $response -StatusCode 405 -Message "Methode niet toegestaan."
        }
      }
      catch {
        try {
          Send-TextError -Response $context.Response -StatusCode 500 -Message $_.Exception.Message
        }
        catch {
          $context.Response.Abort()
        }
      }
    }
  }
  finally {
    $listener.Stop()
    $listener.Close()
  }
}

Start-BoardCreatorServer
