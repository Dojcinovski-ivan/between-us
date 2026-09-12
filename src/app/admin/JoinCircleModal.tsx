"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { AdminModal, CopyField } from "./AdminModal";
import {
  createSeededMember,
  listSeededMembers,
  openAsMember,
  type SeededAccount,
  type SeededMemberResult,
} from "./circleActions";
import type { AdminCircleRow } from "@/lib/circleActivity";

// The warm openers the suggestion button draws from. The five named ones
// come first so they show up most, with a few more in the same register so
// repeated seeding does not produce the same handful of names every time.
const NAME_STEMS = [
  "quiet_oak",
  "still_water",
  "gentle_wave",
  "warm_light",
  "soft_hill",
  "calm_river",
  "kind_meadow",
  "steady_shore",
  "open_sky",
  "slow_dawn",
];

function suggestName() {
  const stem = NAME_STEMS[Math.floor(Math.random() * NAME_STEMS.length)];
  const number = Math.floor(Math.random() * 90) + 10;
  return `${stem}${number}`;
}

type Created = Extract<SeededMemberResult, { username: string }>;

export function JoinCircleModal({
  circle,
  onClose,
  onCreated,
}: {
  circle: AdminCircleRow;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [username, setUsername] = useState(suggestName);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [existing, setExisting] = useState<SeededAccount[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    listSeededMembers(circle.id).then((rows) => {
      if (active) setExisting(rows);
    });
    return () => {
      active = false;
    };
  }, [circle.id]);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createSeededMember({ circleId: circle.id, username });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCreated(result);
      onCreated();
    });
  }

  function handleOpenExisting(userId: string) {
    startTransition(async () => {
      const result = await openAsMember(userId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setLinks((prev) => ({ ...prev, [userId]: result.magicLink }));
    });
  }

  if (created) {
    return (
      <AdminModal
        title={`${created.username} has joined`}
        subtitle={`They are now an ordinary member of ${circle.label}. Nobody in the circle can tell this account apart from anyone else.`}
        onClose={onClose}
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-sage/40 bg-sage-soft px-4 py-3">
            <p className="text-sm font-medium text-sage">Open circle as this member</p>
            <p className="mt-1 text-sm leading-relaxed text-ink">
              Open the link below in a private window. Your browser can only hold one Between Us session at a time, so
              opening it in an ordinary tab would sign you out of admin everywhere.
            </p>
          </div>

          {created.magicLink ? (
            <CopyField
              label="One time sign in link"
              value={created.magicLink}
              hint="Works once, and only for a short while. Use the password below to sign in again later."
            />
          ) : (
            <p className="text-xs text-warn">
              The account was created but the sign in link could not be minted. Use the email and password below.
            </p>
          )}

          <CopyField label="Email" value={created.email} />
          <CopyField
            label="Password"
            value={created.password}
            hint="Shown only now. Save it somewhere if you want to come back as this member."
          />

          <Button onClick={onClose} variant="secondary" className="w-fit">
            Done
          </Button>
        </div>
      </AdminModal>
    );
  }

  return (
    <AdminModal
      title="Join as member"
      subtitle={`A new anonymous account inside ${circle.label}. It looks like any other member: no admin badge, no marketing email, nothing that marks it out.`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="seeded-username" className="text-sm font-medium text-muted">
            Anonymous name
          </label>
          <div className="flex items-center gap-2">
            <input
              id="seeded-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="quiet_oak47"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
            <button
              type="button"
              onClick={() => setUsername(suggestName())}
              className="shrink-0 rounded-xl border border-border bg-surface2 px-3 py-3 text-xs font-medium text-ink hover:bg-surface2/70"
            >
              Suggest
            </button>
          </div>
          <p className="text-xs text-faint">
            3 to 20 characters: letters, numbers and underscores. Change it to anything you like.
          </p>
        </div>

        {error && <p className="text-xs text-warn">{error}</p>}

        <Button onClick={handleCreate} disabled={isPending || !username.trim()} className="w-fit">
          {isPending ? "Creating…" : "Create and join"}
        </Button>

        {existing.length > 0 && (
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-ink">Already seeded here</h3>
            <p className="mt-1 text-xs text-muted">
              Get a fresh sign in link for an account you made earlier. Open it in a private window.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {existing.map((account) => (
                <div key={account.userId} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink">{account.username}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenExisting(account.userId)}
                      disabled={isPending}
                      className="shrink-0 rounded-xl border border-border bg-surface2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface2/70 disabled:opacity-50"
                    >
                      Get link
                    </button>
                  </div>
                  {links[account.userId] && (
                    <CopyField label="One time sign in link" value={links[account.userId]} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
}
