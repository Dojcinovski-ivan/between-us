#!/bin/bash
# Runs the UI tests, signed-in ones included, with the test account from
# ios/.test-credentials (git-ignored; see README.md). Extra arguments go to
# xcodebuild, e.g. -only-testing:BetweenUsUITests/SignedInFlowTests
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .test-credentials ]; then
  set -a
  . ./.test-credentials
  set +a
  # xcodebuild strips the TEST_RUNNER_ prefix and hands the rest to the tests.
  export TEST_RUNNER_TEST_EMAIL="$TEST_EMAIL" TEST_RUNNER_TEST_PASSWORD="$TEST_PASSWORD"
else
  echo "No .test-credentials, so the signed-in tests will be skipped." >&2
fi

xcodebuild test -project BetweenUs.xcodeproj -scheme BetweenUs \
  -destination "platform=iOS Simulator,name=${SIMULATOR:-iPhone 18 Pro}" \
  -parallel-testing-enabled NO "$@"
