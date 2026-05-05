$ErrorActionPreference = 'Stop'

$photoExtensions = @('.jpg', '.jpeg', '.png', '.webp', '.gif')
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputPath = Join-Path $scriptDir 'photos.js'

function Convert-ExifDate {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }

  $clean = $Value.Trim([char]0).Trim()
  $formats = @(
    'yyyy:MM:dd HH:mm:ss',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-ddTHH:mm:ss',
    'yyyy-MM-ddTHH:mm:ssK'
  )

  foreach ($format in $formats) {
    try {
      return [DateTimeOffset]::ParseExact(
        $clean,
        $format,
        [Globalization.CultureInfo]::InvariantCulture,
        [Globalization.DateTimeStyles]::AssumeLocal
      )
    } catch {}
  }

  try {
    return [DateTimeOffset]::Parse($clean, [Globalization.CultureInfo]::InvariantCulture)
  } catch {
    return $null
  }
}

function Get-ExifDateTaken {
  param([string]$Path)

  $extension = [IO.Path]::GetExtension($Path).ToLowerInvariant()
  if ($extension -notin @('.jpg', '.jpeg')) {
    return $null
  }

  try {
    Add-Type -AssemblyName System.Drawing
    $image = [System.Drawing.Image]::FromFile($Path)
    try {
      $datePropertyIds = @(0x9003, 0x9004, 0x0132)
      foreach ($id in $datePropertyIds) {
        if ($image.PropertyIdList -contains $id) {
          $property = $image.GetPropertyItem($id)
          $rawValue = [Text.Encoding]::ASCII.GetString($property.Value)
          $date = Convert-ExifDate $rawValue
          if ($null -ne $date) {
            return $date
          }
        }
      }
    } finally {
      $image.Dispose()
    }
  } catch {
    return $null
  }

  return $null
}

function ConvertTo-JsString {
  param([string]$Value)
  return ($Value | ConvertTo-Json -Compress)
}

$photos = Get-ChildItem -LiteralPath $scriptDir -File |
  Where-Object { $photoExtensions -contains $_.Extension.ToLowerInvariant() } |
  ForEach-Object {
    $exifDate = Get-ExifDateTaken $_.FullName
    $date = if ($null -ne $exifDate) {
      $exifDate
    } else {
      [DateTimeOffset]::new($_.LastWriteTime)
    }

    [PSCustomObject]@{
      Name = $_.Name
      Src = './' + ([Uri]::EscapeDataString($_.Name) -replace '%2F', '/')
      Date = $date
      Sort = $date.ToUnixTimeMilliseconds()
      Source = if ($null -ne $exifDate) { 'metadata' } else { 'file' }
    }
  } |
  Sort-Object -Property @{ Expression = 'Sort'; Descending = $true }, @{ Expression = 'Name'; Descending = $false }

$lines = @()
$lines += 'window.RAAM_LAAKKWARTIER_PHOTOS = ['
foreach ($photo in $photos) {
  $lines += ('  {{ src: {0}, name: {1}, date: {2}, sort: {3}, source: {4} }},' -f
    (ConvertTo-JsString $photo.Src),
    (ConvertTo-JsString $photo.Name),
    (ConvertTo-JsString $photo.Date.ToString('o')),
    $photo.Sort,
    (ConvertTo-JsString $photo.Source)
  )
}
$lines += '];'

Set-Content -LiteralPath $outputPath -Value $lines -Encoding UTF8
Write-Host ("Updated photos.js with {0} photo(s)." -f $photos.Count)
