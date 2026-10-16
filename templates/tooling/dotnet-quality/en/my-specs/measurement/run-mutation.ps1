[CmdletBinding()]
param(
    [string]$SolutionPath,
    [string[]]$Files,
    [string]$Since
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

# Names of this folder's files and results, in the workspace language. Every line outside this block is
# identical in the English and Portuguese copies of this script.
$mutationName = 'mutation'
$configName = 'stryker-config.json'
# End of the names in the workspace language.

# This folder lives two levels below the repository root, in the Myspec workspace (my-specs/measurement or
# minhas-specs/medicao). Paths are derived from it so a workspace rename does not break the script.
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$measurementPath = [System.IO.Path]::GetRelativePath($repositoryRoot, $PSScriptRoot) -replace '\\', '/'
$mutationDirectory = Join-Path $PSScriptRoot $mutationName
$configPath = Join-Path $PSScriptRoot $configName
$reportPath = Join-Path $mutationDirectory 'reports/mutation-report.json'
$resolvedSolutionPath = Resolve-SolutionPath -RepositoryRoot $repositoryRoot -RequestedPath $SolutionPath

if (-not (Test-Path -LiteralPath $configPath -PathType Leaf)) {
    throw "Stryker configuration was not found at '$configPath'."
}

Push-Location $repositoryRoot
try {
    Invoke-DotnetCommand -Arguments @('restore', $resolvedSolutionPath)
    Invoke-DotnetCommand -Arguments @('tool', 'restore')

    Remove-Item -LiteralPath $mutationDirectory -Recurse -Force -ErrorAction SilentlyContinue

    $arguments = @(
        'stryker', '--solution', $resolvedSolutionPath,
        '--config-file', "$measurementPath/$configName",
        '--output', "$measurementPath/$mutationName"
    )
    # pwsh -File passes "a.cs,b.cs" as a single string, so split it here. Stryker matches --mutate globs
    # against full paths, so a repository-relative path needs a leading wildcard.
    $filePaths = @($Files | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    foreach ($file in $filePaths) {
        $arguments += @('--mutate', "**/$(($file -replace '\\', '/') -replace '^\./', '')")
    }
    if ($Since) {
        $arguments += "--since:$Since"
    }
    Invoke-DotnetCommand -Arguments $arguments

    if (-not (Test-Path -LiteralPath $reportPath -PathType Leaf)) {
        throw "Mutation testing completed without producing '$reportPath'."
    }

    Write-Host "Mutation report: $(Join-Path $mutationDirectory 'reports/mutation-report.html')"
}
finally {
    Pop-Location
}
