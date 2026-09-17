"use client";

import { useState, useTransition } from "react";
import { exportMyData, eraseAccountAndSignOut } from "./accountActions";

// The two rights that previously existed only as an email address in the
// privacy policy: a copy of your data, and deletion of it. Doing them in
// the product rather than by inbox is what makes the one month deadline in
// Article 12(3) something that holds without anybody remembering.

export function DataAndAccount() {
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isExporting, startExport] = useTransition();
  const [isErasing, startErase] = useTransition();

  function handleExport() {
    setError(null);
    startExport(async () => {
      const result = await exportMyData();
      if (!result.ok || !result.data) {
        setError(result.error ?? "We could not put your data together just now.");
        return;
      }

      // Built and revoked in the browser so the file never has to be
      // parked on a server where it would be a second copy of everything.
      const url = URL.createObjectURL(new Blob([result.data], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `between-us-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleErase() {
    setError(null);
    startErase(async () => {
      const result = await eraseAccountAndSignOut();
      // Only returns on failure. On success it signs out and redirects.
      if (result && !result.ok) {
        setError(result.error ?? "We could not delete your account just now.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-medium text-ink">Your data</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Download everything Between Us holds about you as a file you can
          keep or take elsewhere.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="mt-3 rounded-lg border border-border px-3 py-2 text-xs text-muted hover:bg-surface2 hover:text-ink disabled:opacity-50"
        >
          {isExporting ? "Putting it together…" : "Download my data"}
        </button>
      </div>

      <div className="border-t border-border pt-5">
        <h2 className="text-sm font-medium text-ink">Delete your account</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          This removes your email address, your name here, and everything
          you told us about your experiences. It cannot be undone. The posts
          you wrote stay in your circle, shown as coming from a former
          member, because they are part of conversations other people were
          in.
        </p>

        {!isConfirming ? (
          <button
            type="button"
            onClick={() => setIsConfirming(true)}
            className="mt-3 rounded-lg border border-border px-3 py-2 text-xs text-warn hover:bg-surface2"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <label className="text-xs text-muted">
              Type <span className="font-medium text-ink">DELETE</span> to confirm.
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleErase}
                disabled={confirmText !== "DELETE" || isErasing}
                className="rounded-lg bg-warn px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                {isErasing ? "Deleting…" : "Delete permanently"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirming(false);
                  setConfirmText("");
                }}
                className="rounded-lg border border-border px-3 py-2 text-xs text-muted hover:bg-surface2 hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-warn">{error}</p>}
    </div>
  );
}
