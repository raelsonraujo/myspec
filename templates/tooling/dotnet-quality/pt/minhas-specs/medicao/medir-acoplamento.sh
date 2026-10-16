#!/usr/bin/env bash

set -euo pipefail

solution_path=''

while [[ $# -gt 0 ]]; do
  case "$1" in
    --solution)
      if [[ $# -lt 2 ]]; then
        echo "Option '--solution' requires a path." >&2
        exit 64
      fi

      solution_path=$2
      shift 2
      ;;
    *)
      echo "Usage: $0 [--solution <path-to-solution>]" >&2
      exit 64
      ;;
  esac
done

# Names of this folder's files and results, in the workspace language. Every line outside this block is
# identical in the English and Portuguese copies of this script.
coupling_name='acoplamento'
targets_name='acoplamento.targets'
# End of the names in the workspace language.

# This folder lives two levels below the repository root, in the Myspec workspace (my-specs/measurement or
# minhas-specs/medicao). Paths are derived from it so a workspace rename does not break the script.
measurement_directory=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repository_root=$(cd "$measurement_directory/../.." && pwd)
coupling_directory="$measurement_directory/$coupling_name"
targets_path="$measurement_directory/$targets_name"

if [[ ! -f $targets_path ]]; then
  echo "Coupling targets were not found at '$targets_path'." >&2
  exit 1
fi

# MSBuild resolves these properties relative to each project, so they must be absolute native paths.
native_path() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else printf '%s' "$1"; fi
}

cd "$repository_root"

if [[ -n $solution_path ]]; then
  [[ $solution_path != /* ]] && solution_path="$repository_root/$solution_path"

  if [[ ! -f $solution_path ]]; then
    echo "Solution file was not found at '$solution_path'." >&2
    exit 1
  fi

  case "$solution_path" in
    *.sln|*.slnx) ;;
    *)
      echo "Solution path must reference a .sln or .slnx file." >&2
      exit 1
      ;;
  esac
else
  solution_files=()
  while IFS= read -r solution_file; do
    solution_files+=("$solution_file")
  done < <(find "$repository_root" -maxdepth 1 -type f \( -name '*.sln' -o -name '*.slnx' \) -print)
  if [[ ${#solution_files[@]} -ne 1 ]]; then
    echo "Expected exactly one .sln or .slnx file in '$repository_root'. Use '--solution <path>' to select one explicitly." >&2
    exit 1
  fi

  solution_path=${solution_files[0]}
fi

dotnet restore "$solution_path"

rm -rf "$coupling_directory"
mkdir -p "$coupling_directory"
# The results are regenerated on every run, so they ignore themselves.
printf '*\n' > "$coupling_directory/.gitignore"

# A full rebuild makes the analyzers run on every project instead of reusing an up-to-date build.
dotnet build "$solution_path" --configuration Release --no-restore --no-incremental \
  "-p:CustomAfterMicrosoftCommonTargets=$(native_path "$targets_path")" \
  "-p:CouplingResultsDirectory=$(native_path "$coupling_directory")"

result_file=$(find "$coupling_directory" -maxdepth 1 -type f -name '*.sarif' -print -quit)
if [[ -z $result_file ]]; then
  echo "The build completed without producing SARIF logs in '$coupling_directory'." >&2
  exit 1
fi

printf 'Coupling results: %s\n' "$coupling_directory"
