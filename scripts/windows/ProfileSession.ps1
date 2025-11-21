param(
    [Parameter(Mandatory = $true)]
    [string]$ProfileId,

    [string[]]$Args
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$CliEntry = Join-Path $ProjectRoot "dist/cli.js"

if (-not (Test-Path $CliEntry)) {
    throw "CLI 未构建，请先运行 npm run build"
}

$NodeBin = if ($env:NODE_BIN) { $env:NODE_BIN } else { (Get-Command node -ErrorAction Stop).Source }

function Invoke-FirefoxAbCli {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$CliArgs)
    & $NodeBin $CliEntry @CliArgs
    if ($LASTEXITCODE -ne 0) {
        throw "firefox-ab CLI 执行失败，退出码 $LASTEXITCODE"
    }
}

$thawed = $false
try {
    Invoke-FirefoxAbCli thaw $ProfileId
    $thawed = $true
    Invoke-FirefoxAbCli extensions sync $ProfileId
    if ($Args -and $Args.Length -gt 0) {
        $argString = [string]::Join(' ', $Args)
        Invoke-FirefoxAbCli launch $ProfileId --args $argString
    }
    else {
        Invoke-FirefoxAbCli launch $ProfileId
    }
}
finally {
    if ($thawed) {
        Invoke-FirefoxAbCli freeze $ProfileId | Out-Null
    }
}
