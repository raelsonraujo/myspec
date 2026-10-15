[CmdletBinding()]
param(
    [switch]$NoOpen,
    [string]$SolutionPath
)

$ErrorActionPreference = 'Stop'

function Invoke-DotnetCommand {
    param([Parameter(Mandatory)][string[]]$Arguments)

    & dotnet @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Resolve-SolutionPath {
    param(
        [Parameter(Mandatory)][string]$RepositoryRoot,
        [string]$RequestedPath
    )

    if ($RequestedPath) {
        $candidate = if ([System.IO.Path]::IsPathRooted($RequestedPath)) {
            $RequestedPath
        }
        else {
            Join-Path $RepositoryRoot $RequestedPath
        }

        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            throw "Solution file was not found at '$candidate'."
        }

        if ([System.IO.Path]::GetExtension($candidate) -notin '.sln', '.slnx') {
            throw "Solution path must reference a .sln or .slnx file."
        }

        return [System.IO.Path]::GetFullPath($candidate)
    }

    $solutions = @(Get-ChildItem -LiteralPath $RepositoryRoot -File |
            Where-Object { $_.Extension -in '.sln', '.slnx' })

    if ($solutions.Count -ne 1) {
        throw "Expected exactly one .sln or .slnx file in '$RepositoryRoot'. Use '-SolutionPath <path>' to select one explicitly."
    }

    return $solutions[0].FullName
}

# This folder lives two levels below the repository root, in the Myspec workspace (my-specs/measurement or
# minhas-specs/medicao). Paths are derived from it so a workspace rename does not break the script.
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$measurementPath = [System.IO.Path]::GetRelativePath($repositoryRoot, $PSScriptRoot) -replace '\\', '/'
$coverageDirectory = Join-Path $PSScriptRoot 'coverage'
$rawCoverageDirectory = Join-Path $coverageDirectory 'raw'
$reportDirectory = Join-Path $coverageDirectory 'report'
$runSettingsPath = Join-Path $PSScriptRoot 'coverlet.runsettings'
$reportPath = Join-Path $reportDirectory 'index.html'
$resolvedSolutionPath = Resolve-SolutionPath -RepositoryRoot $repositoryRoot -RequestedPath $SolutionPath

if (-not (Test-Path -LiteralPath $runSettingsPath -PathType Leaf)) {
    throw "Coverage runsettings were not found at '$runSettingsPath'."
}

Push-Location $repositoryRoot
try {
    Invoke-DotnetCommand -Arguments @('restore', $resolvedSolutionPath)
    Invoke-DotnetCommand -Arguments @('tool', 'restore')

    Remove-Item -LiteralPath $coverageDirectory -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Path $rawCoverageDirectory -Force | Out-Null

    Invoke-DotnetCommand -Arguments @('build', $resolvedSolutionPath, '--configuration', 'Release', '--no-restore')
    Invoke-DotnetCommand -Arguments @(
        'test', $resolvedSolutionPath, '--configuration', 'Release', '--no-build',
        '--settings', "$measurementPath/coverlet.runsettings", '--collect:XPlat Code Coverage',
        '--results-directory', "$measurementPath/coverage/raw"
    )

    $coverageFiles = Get-ChildItem -LiteralPath $rawCoverageDirectory -Filter 'coverage.cobertura.xml' -File -Recurse
    if ($coverageFiles.Count -eq 0) {
        throw "Coverage collection completed without producing Cobertura files in '$rawCoverageDirectory'."
    }

    Invoke-DotnetCommand -Arguments @(
        'reportgenerator', "-reports:$measurementPath/coverage/raw/**/coverage.cobertura.xml",
        "-targetdir:$measurementPath/coverage/report", '-reporttypes:Html;JsonSummary;Cobertura'
    )

    if (-not (Test-Path -LiteralPath $reportPath -PathType Leaf)) {
        throw "Report generation completed without producing '$reportPath'."
    }

    Write-Host "Coverage report: $reportPath"
    if (-not $NoOpen) {
        if ($IsWindows) {
            Start-Process -FilePath $reportPath
        }
        elseif ($IsMacOS) {
            & open $reportPath
        }
        else {
            & xdg-open $reportPath
        }
    }
}
finally {
    Pop-Location
}
