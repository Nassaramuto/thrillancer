import { useState } from "react";
import type { SessionUser } from "@thrillancer/contracts";
import { NICKNAME_MAX, validateNickname } from "@thrillancer/contracts";
import { prefs } from "./prefs";

interface Props {
  user: SessionUser | null;
  quality: "high" | "low";
  onQuality: (q: "high" | "low") => void;
  onEnter: (nickname: string) => void;
  onSignOut: () => void;
  error: string;
}

export function Entry({ user, quality, onQuality, onEnter, onSignOut, error }: Props) {
  const [nick, setNick] = useState(user?.nickname ?? prefs.nickname());
  const check = validateNickname(nick);
  const msg = nick && !check.ok ? check.reason : "";
  return (
    <div className="entry">
      <div className="entry-card">
        <div className="brand">THRILLANCER</div>
        <p className="tag">A community-built alternative Earth rooted in crypto culture. Proof-of-concept plaza.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (check.ok) onEnter(check.value);
          }}
        >
          <label htmlFor="nick">Choose a nickname</label>
          <input id="nick" autoFocus value={nick} maxLength={NICKNAME_MAX} onChange={(e) => setNick(e.target.value)} placeholder="e.g. Vibecoder" autoComplete="off" />
          {msg && <div className="hint err">{msg}</div>}
          {error && <div className="hint err">{error}</div>}
          <button className="btn primary big" type="submit" disabled={!check.ok}>
            {user ? `Continue as ${user.nickname}` : "Enter as guest"}
          </button>
        </form>
        <button className="btn big" disabled title="Solana wallet sign-in is Milestone 2. Guests can already do everything in Milestone 1.">
          Connect Solana wallet · coming in Milestone 2
        </button>
        <div className="entry-foot">
          <label className="chk">
            <input type="checkbox" checked={quality === "low"} onChange={(e) => onQuality(e.target.checked ? "low" : "high")} /> Low-quality mode (older laptops)
          </label>
          {user && (
            <button className="link" onClick={onSignOut} title="Ends this browser's guest identity. A guest cannot be recovered after sign-out.">
              Sign out (forget this guest)
            </button>
          )}
        </div>
        <p className="fine">
          Guest play is free and needs no wallet. No private keys are ever requested. Desktop browsers only for now; mobile is untested.
        </p>
      </div>
    </div>
  );
}
