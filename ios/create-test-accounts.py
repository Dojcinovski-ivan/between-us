#!/usr/bin/env python3
"""One-off setup for the signed-in UI tests (see README.md).

Creates two confirmed accounts with finished profiles, alone together in a
circle whose category is 'ui_test_only'. Members are matched to circles by
category and onboarding only ever produces the real ones, so nobody else can
be placed in it. Writes the login to ios/.test-credentials (git-ignored).

Writes to whichever Supabase project the env file points at:

    python3 ios/create-test-accounts.py            # shows what it would do
    python3 ios/create-test-accounts.py --apply    # does it
"""
import datetime
import json
import os
import secrets
import string
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_FILE = os.path.join(ROOT, ".env.local")
CREDENTIALS_FILE = os.path.join(ROOT, "ios", ".test-credentials")

EMAILS = ["ivan.dojcinovski+butest1@outlook.com", "ivan.dojcinovski+butest2@outlook.com"]
CATEGORY = "ui_test_only"


def read_env(path):
    values = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                values[key.strip()] = value.strip().strip("\"'")
    return values


env = read_env(ENV_FILE)
URL = env["NEXT_PUBLIC_SUPABASE_URL"]
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]


def call(method, path, body=None, prefer=None):
    headers = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(URL + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            return json.load(response)
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {path} failed: {e.code} {e.read().decode()}")


def profile(user_id, number, circle_id, now):
    return {
        "id": user_id,
        "username": f"ui_test_{number}",
        "category": CATEGORY,
        "circle_id": circle_id,
        "felt_experience": "unsure",
        "who_was_it": "someone_else",
        "mechanisms": [],
        "journey_stage": "healing",
        "age_range": "25_34",
        "gender": "prefer_not_to_say",
        "country": "North Macedonia",
        "email_marketing_consent": False,
        "special_category_consent_at": now,
        "age_confirmed_at": now,
    }


def main():
    apply = "--apply" in sys.argv
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    print(f"Project: {URL}")
    existing = call("GET", f"/rest/v1/circles?select=id&category=eq.{CATEGORY}")
    if existing:
        sys.exit(f"A '{CATEGORY}' circle already exists ({existing[0]['id']}). Nothing done.")

    if not apply:
        print("Dry run. With --apply this would:")
        for email in EMAILS:
            print(f"  create auth user {email} (email confirmed, random password)")
        print(f"  insert circle {{category: '{CATEGORY}', member_count: 2}}")
        for number in (1, 2):
            print("  insert users row " + json.dumps(profile("<auth id>", number, "<circle id>", "<now>")))
        print(f"  write {CREDENTIALS_FILE}")
        return

    alphabet = string.ascii_letters + string.digits
    password = "".join(secrets.choice(alphabet) for _ in range(32))

    ids = []
    for email in EMAILS:
        user = call("POST", "/auth/v1/admin/users", {
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"age_confirmed_at": now, "email_marketing_consent": False},
        })
        ids.append(user["id"])
        print(f"auth user {email} {user['id']}")

        # Saved as soon as an account exists, so its password is never lost.
        with open(CREDENTIALS_FILE, "w") as f:
            f.write("# Test accounts for the signed-in UI tests. Both share this password and\n")
            f.write(f"# sit alone in the '{CATEGORY}' circle. Never commit this file.\n")
            f.write(f"TEST_EMAIL={EMAILS[0]}\nTEST_PASSWORD={password}\nTEST_EMAIL_2={EMAILS[1]}\n")
        os.chmod(CREDENTIALS_FILE, 0o600)

    circle = call("POST", "/rest/v1/circles", {"category": CATEGORY, "member_count": 2}, "return=representation")[0]
    print(f"circle {circle['id']} {circle['category']}")

    rows = [profile(user_id, number, circle["id"], now) for number, user_id in enumerate(ids, 1)]
    for row in call("POST", "/rest/v1/users", rows, "return=representation"):
        print(f"profile {row['username']} in circle {row['circle_id']}")

    print(f"Credentials saved to {CREDENTIALS_FILE}")


if __name__ == "__main__":
    main()
