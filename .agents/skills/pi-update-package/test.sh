#!/usr/bin/env bash
set -euo pipefail

skill_dir=$(cd "$(dirname "$0")" && pwd)
helper="$skill_dir/pi-update-package.sh"
root=$(git -C "$skill_dir" rev-parse --show-toplevel)
cd "$root"

expect_failure() {
  if bash "$helper" "$@"; then
    printf 'FAIL: expected rejection: %s\n' "$*" >&2
    exit 1
  fi
}

bash -n "$helper"
bash -n "$0"
bash -n "$skill_dir/test-replay.sh"
bash "$skill_dir/test-replay.sh"
help=$(bash "$helper" --help)
printf '%s\n' "$help"
[[ "$help" == *finish* && "$help" != *checkpoint* ]]
expect_failure checkpoint
expect_failure plan ../escape
expect_failure plan /absolute
expect_failure branch main --confirmed
expect_failure branch unapproved
expect_failure unknown-command

# Use a Git shim to exercise main/detached guards without switching real branches.
real_git=$(command -v git)
fixture=$(mktemp -d /tmp/pi-update-package-test.XXXXXX)
trap 'unlink "$fixture/git"; rmdir "$fixture"' EXIT
printf '#!/usr/bin/env bash\nif [[ "$1" == symbolic-ref ]]; then\n  if [[ "$TEST_DETACHED" == yes ]]; then exit 1; fi\n  printf "main\\n"\nelse\n  exec "$TEST_REAL_GIT" "$@"\nfi\n' > "$fixture/git"
chmod +x "$fixture/git"
TEST_REAL_GIT="$real_git" TEST_DETACHED=no PATH="$fixture:$PATH" \
  expect_failure apply guard-test invalid
TEST_REAL_GIT="$real_git" TEST_DETACHED=yes PATH="$fixture:$PATH" \
  expect_failure apply guard-test invalid

if [[ "${1:-}" == --source ]]; then
  bash "$helper" discover
  package=${2:?Provide a source package directory for --source}
  plan=$(bash "$helper" plan "$package")
  printf '%s\n' "$plan"
  first=$(printf '%s\n' "$plan" | awk 'length($1) == 40 && $1 ~ /^[0-9a-f]+$/ { if (!found) { print $1; found=1 } }')
  if [[ -n "$first" ]]; then
    bash "$helper" patch "$package" "$first" | git apply --stat
  fi
fi
printf 'Smoke tests passed. No real imports or commits were performed.\n'
