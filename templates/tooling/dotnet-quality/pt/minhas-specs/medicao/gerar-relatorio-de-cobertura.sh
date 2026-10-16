#!/usr/bin/env bash

set -euo pipefail

no_open=false
solution_path=''

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-open)
      no_open=true
      shift
      ;;
    --solution)
      if [[ $# -lt 2 ]]; then
        echo "Option '--solution' requires a path." >&2
        exit 64
      fi

      solution_path=$2
      shift 2
      ;;
    *)
      echo "Usage: $0 [--no-open] [--solution <path-to-solution>]" >&2
      exit 64
      ;;
  esac
done

# Names of this folder's files and results, in the workspace language. Every line outside this block is
# identical in the English and Portuguese copies of this script.
coverage_name='cobertura'
raw_name='bruto'
report_name='relatorio'
runsettings_name='cobertura.runsettings'
# End of the names in the workspace language.

# This folder lives two levels below the repository root, in the Myspec workspace (my-specs/measurement or
# minhas-specs/medicao). Paths are derived from it so a workspace rename does not break the script.
measurement_directory=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repository_root=$(cd "$measurement_directory/../.." && pwd)
measurement_path=${measurement_directory#"$repository_root"/}
coverage_directory="$measurement_directory/$coverage_name"
raw_coverage_directory="$coverage_directory/$raw_name"
report_directory="$coverage_directory/$report_name"
runsettings_path="$measurement_directory/$runsettings_name"
report_path="$report_directory/index.html"

if [[ ! -f $runsettings_path ]]; then
  echo "Coverage runsettings were not found at '$runsettings_path'." >&2
  exit 1
fi

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
dotnet tool restore

rm -rf "$coverage_directory"
mkdir -p "$raw_coverage_directory"

dotnet build "$solution_path" --configuration Release --no-restore
# Architecture tests only inspect assemblies, add no coverage, and are measured by the architecture tests script, so a
# violated dependency rule must not stop this run.
dotnet test "$solution_path" --configuration Release --no-build \
  --filter 'FullyQualifiedName!~.ArchitectureTests.' \
  --settings "$measurement_path/$runsettings_name" \
  --collect:"XPlat Code Coverage" \
  --results-directory "$measurement_path/$coverage_name/$raw_name"

coverage_file=$(find "$raw_coverage_directory" -type f -name 'coverage.cobertura.xml' -print -quit)
if [[ -z $coverage_file ]]; then
  echo "Coverage collection completed without producing Cobertura files in '$raw_coverage_directory'." >&2
  exit 1
fi

dotnet reportgenerator \
  -reports:"$measurement_path/$coverage_name/$raw_name/**/coverage.cobertura.xml" \
  -targetdir:"$measurement_path/$coverage_name/$report_name" \
  -reporttypes:"Html;JsonSummary;Cobertura"

if [[ ! -f $report_path ]]; then
  echo "Report generation completed without producing '$report_path'." >&2
  exit 1
fi

printf 'Coverage report: %s\n' "$report_path"
if [[ $no_open == false ]]; then
  case "$(uname -s)" in
    Darwin) open "$report_path" ;;
    Linux) xdg-open "$report_path" ;;
    MINGW*|MSYS*|CYGWIN*) cmd.exe /c start "" "$report_path" ;;
    *) echo "Open '$report_path' in a browser." ;;
  esac
fi
