<#
    Computes the Chrome extension id of an unpacked extension from its path.

    Chrome derives the id of an unpacked extension from the SHA-256 of the
    absolute path, encoded as UTF-16LE; the first 16 bytes are rendered as
    hex digits mapped to the letters a-p.

    Usage:  powershell -File Compute-ExtensionId.ps1 -Path "C:\path\to\ext"
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

$full = (Resolve-Path -LiteralPath $Path).Path.TrimEnd('\')
$sha = [System.Security.Cryptography.SHA256]::Create()
$hash = $sha.ComputeHash([System.Text.Encoding]::Unicode.GetBytes($full))
$hex = -join ($hash[0..15] | ForEach-Object { $_.ToString('x2') })
$id = -join ($hex.ToCharArray() | ForEach-Object {
    [char]([int][char]'a' + [Convert]::ToInt32($_, 16))
})
Write-Output $id
