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

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
coverage_directory="$repository_root/quality/coverage"
raw_coverage_directory="$coverage_directory/raw"
report_directory="$coverage_directory/report"
runsettings_path="$repository_root/quality/coverlet.runsettings"
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
dotnet test "$solution_path" --configuration Release --no-build \
  --settings quality/coverlet.runsettings \
  --collect:"XPlat Code Coverage" \
  --results-directory quality/coverage/raw

coverage_file=$(find "$raw_coverage_directory" -type f -name 'coverage.cobertura.xml' -print -quit)
if [[ -z $coverage_file ]]; then
  echo "Coverage collection completed without producing Cobertura files in '$raw_coverage_directory'." >&2
  exit 1
fi

dotnet reportgenerator \
  -reports:"quality/coverage/raw/**/coverage.cobertura.xml" \
  -targetdir:"quality/coverage/report" \
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
