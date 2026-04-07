#!/usr/bin/env bash
set -euo pipefail

# Ensure Node/NPM come from nvm (avoids WSL/host npm mismatch).
if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
  export NVM_DIR="${HOME}/.nvm"
  # shellcheck source=/dev/null
  . "${NVM_DIR}/nvm.sh"
  nvm use default >/dev/null
fi

# Use newer libstdc++ if present to satisfy GitNexus native module.
LIBSTDCPP_DIR="${HOME}/.local/libstdcpp-jammy-ppa/usr/lib/x86_64-linux-gnu"
if [[ -d "${LIBSTDCPP_DIR}" ]]; then
  export LD_LIBRARY_PATH="${LIBSTDCPP_DIR}:${LD_LIBRARY_PATH:-}"
fi

# In sandboxed environments, ~/.gitnexus may be read-only.
# Redirect HOME for GitNexus writes only after nvm has been initialized.
LOCAL_HOME="${PWD}/.cache/gitnexus-home"
mkdir -p "${LOCAL_HOME}"
export HOME="${LOCAL_HOME}"

if [[ $# -eq 0 ]]; then
  exec npx --no-install gitnexus status
fi

# `gitnexus analyze` can mis-detect repo when path is omitted in some shells.
if [[ "$1" == "analyze" && $# -eq 1 ]]; then
  exec npx --no-install gitnexus analyze .
fi

exec npx --no-install gitnexus "$@"
