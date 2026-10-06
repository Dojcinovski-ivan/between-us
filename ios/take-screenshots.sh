#!/bin/bash
# Takes the App Store screenshots into ios/screenshots (git-ignored), from
# the app's demo mode. App Store Connect's required iPhone slot ("medium
# display") takes 1206 x 2622, which is the iPhone 18 Pro.
set -euo pipefail
cd "$(dirname "$0")"

SIMULATOR="${SIMULATOR:-iPhone 18 Pro}"
RESULT="$(mktemp -d)/screenshots.xcresult"

xcrun simctl boot "$SIMULATOR" 2>/dev/null || true
# The clean status bar Apple's own screenshots use.
xcrun simctl status_bar "$SIMULATOR" override --time "9:41" --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3

TEST_RUNNER_SCREENSHOTS=1 xcodebuild test -project BetweenUs.xcodeproj -scheme BetweenUs \
  -destination "platform=iOS Simulator,name=$SIMULATOR" -parallel-testing-enabled NO \
  -only-testing:BetweenUsUITests/ScreenshotTests -resultBundlePath "$RESULT" -quiet

rm -rf screenshots && mkdir screenshots
xcrun xcresulttool export attachments --path "$RESULT" --output-path screenshots
# The export names files by ID; the manifest has the names the test gave them.
python3 - <<'PY'
import json, os
for test in json.load(open("screenshots/manifest.json")):
    for a in test["attachments"]:
        name = a["suggestedHumanReadableName"].split("_0_")[0] + ".png"
        os.rename("screenshots/" + a["exportedFileName"], "screenshots/" + name)
os.remove("screenshots/manifest.json")
PY
xcrun simctl status_bar "$SIMULATOR" clear
echo "Screenshots are in ios/screenshots"
