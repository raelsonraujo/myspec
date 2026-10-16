[CmdletBinding()]
param(
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

# Names of this folder's files and results, in the workspace language. Every line outside this block is
# identical in the English and Portuguese copies of this script.
$couplingName = 'coupling'
$targetsName = 'coupling.targets'
# End of the names in the workspace language.

# This folder lives two levels below the repository root, in the Myspec workspace (my-specs/measurement or
# minhas-specs/medicao). Paths are derived from it so a workspace rename does not break the script.
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$couplingDirectory = Join-Path $PSScriptRoot $couplingName
$targetsPath = Join-Path $PSScriptRoot $targetsName
$resolvedSolutionPath = Resolve-SolutionPath -RepositoryRoot $repositoryRoot -RequestedPath $SolutionPath

if (-not (Test-Path -LiteralPath $targetsPath -PathType Leaf)) {
    throw "Coupling targets were not found at '$targetsPath'."
}

Push-Location $repositoryRoot
try {
    Invoke-DotnetCommand -Arguments @('restore', $resolvedSolutionPath)

    Remove-Item -LiteralPath $couplingDirectory -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Path $couplingDirectory -Force | Out-Null
    # The results are regenerated on every run, so they ignore themselves.
    Set-Content -LiteralPath (Join-Path $couplingDirectory '.gitignore') -Value '*'

    # A full rebuild makes the analyzers run on every project instead of reusing an up-to-date build.
    # MSBuild resolves both properties relative to each project, so they are absolute paths.
    Invoke-DotnetCommand -Arguments @(
        'build', $resolvedSolutionPath, '--configuration', 'Release', '--no-restore', '--no-incremental',
        "-p:CustomAfterMicrosoftCommonTargets=$targetsPath",
        "-p:CouplingResultsDirectory=$couplingDirectory"
    )

    $resultFiles = @(Get-ChildItem -LiteralPath $couplingDirectory -Filter '*.sarif' -File)
    if ($resultFiles.Count -eq 0) {
        throw "The build completed without producing SARIF logs in '$couplingDirectory'."
    }

    Write-Host "Coupling results: $couplingDirectory"
}
finally {
    Pop-Location
}
