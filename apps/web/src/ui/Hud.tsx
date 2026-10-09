import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CHAT_MAX_LENGTH, REPORT_REASONS, TELEPORT_POINTS } from "@thrillancer/contracts";
import type { ChatBroadcast, PublicProfile, SessionUser } from "@thrillancer/contracts";
import { api } from "../net/api";
import type { ConnStatus, PlazaConnection } from "../net/connection";
import type { Game, GameStats, PlayerView, Quality, TravelFilter } from "../world/game";
import { Minimap } from "./Minimap";

interface Props {
  conn: PlazaConnection;
  game: Game;
  user: SessionUser;
  status: ConnStatus;
  quality: Quality;
  onQuality: (q: Quality) => void;
  onLeave: () => void;
  onSignOut: () => void;
}

const CATS: Array<[TravelFilter, string]> = [["all", "All"], ["act", "Activities"], ["comm", "Communities"], ["explore", "Explore"]];

export function Hud({ conn, game, user, status, quality, onQuality, onLeave, onSignOut }: Props) {
  const ui = useSyncExternalStore(game.subscribe, game.getUi);
  const [messages, setMessages] = useState<ChatBroadcast[]>([]);
  const [players, setPlayers] = useState<PlayerView[]>([]);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [debug, setDebug] = useState(false);
  const [muted, setMuted] = useState<Set<string>>(new Set());
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [profile, setProfile] = useState<{ p?: PublicProfile; id: string; err?: string } | null>(null);
  const [menu, setMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const say = useCallback((t: string) => {
    setNote(t);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(""), 3500);
  }, []);

  const openProfile = useCallback((id: string) => {
    setProfile({ id });
    api
      .profile(id)
      .then((r) => setProfile({ id, p: r.profile }))
      .catch(() => setProfile({ id, err: "Could not load this profile." }));
  }, []);

  useEffect(() => {
    const offs = [
      conn.on("welcome", (w) => {
        setBlocked(new Set(w.blocked));
        setMessages((m) => (m.length ? m : w.history));
      }),
      conn.on("chat", (m) => setMessages((prev) => [...prev.slice(-99), m])),
      conn.on("chatError", (e) =>
        say(e.code === "rate_limited" ? `Slow down: you can chat again in ${Math.ceil((e.retryAfterMs ?? 1000) / 1000)}s.` : "That message was not sent (empty, repeated or too long)."),
      ),
      conn.on("blocked", (ids) => setBlocked(new Set(ids))),
      conn.on("reportResult", (r) => say(r.ok ? "Report sent to the moderators. Thank you." : r.reason === "rate_limited" ? "You are sending reports too fast." : "Report could not be sent.")),
    ];
    game.onPick = openProfile;
    game.onChatFocus = () => inputRef.current?.focus();
    return () => {
      offs.forEach((o) => o());
      game.onPick = undefined;
      game.onChatFocus = undefined;
    };
  }, [conn, game, say, openProfile]);

  useEffect(() => {
    const t = setInterval(() => {
      setPlayers(game.playerViews());
      setStats(game.stats());
    }, 250);
    return () => clearInterval(t);
  }, [game]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        (document.activeElement as HTMLElement | null)?.blur();
        setProfile(null);
        setMenu(false);
      } else if (e.code === "F3") {
        e.preventDefault();
        setDebug((d) => !d);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const v = inputRef.current!.value.trim();
    if (v) conn.chat(v);
    inputRef.current!.value = "";
    inputRef.current!.blur();
  };

  const visible = useMemo(() => messages.filter((m) => !muted.has(m.fromId) && !blocked.has(m.fromId)).slice(-6), [messages, muted, blocked]);
  const online = players.filter((p) => p.kind === "user" && p.connected).length;
  const toggleMute = (id: string) =>
    setMuted((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const city = ui.mode === "city";
  const route = ui.routeId ? TELEPORT_POINTS.find((p) => p.id === ui.routeId) : undefined;
  const sel = ui.selId ? TELEPORT_POINTS.find((p) => p.id === ui.selId) : undefined;
  const list = TELEPORT_POINTS.filter((d) => ui.travFilter === "all" || d.cat === ui.travFilter);
  const me = players.find((p) => p.isSelf);
  const dist = (x: number, z: number) => Math.round(Math.hypot(x - (stats?.pos.x ?? me?.x ?? 0), z - (stats?.pos.z ?? me?.z ?? 0)));
  const O = ui.opts;
  const d = ui.disc;

  return (
    <div className={`hud ${ui.mode === "tour" ? "tour" : ""}`}>
      {status !== "connected" && <div className="banner">{status === "reconnecting" ? "Connection lost. Trying to rejoin your seat…" : status === "connecting" ? "Connecting…" : "Not connected"}</div>}
      <div className="zg-bar" style={{ top: 0 }} />
      <div className="zg-bar" style={{ bottom: 0 }} />

      <div className="zg-a" style={{ left: 18, top: 14, display: "flex", gap: 12, alignItems: "center", opacity: ui.mode === "tour" ? 0 : 1 }}>
        <h1 style={{ fontSize: 18, letterSpacing: ".14em" }}>THRILLANCER</h1>
        <div className="zg-pn" style={{ display: "flex", gap: 9, alignItems: "center", padding: "6px 12px 6px 8px" }}>
          <div style={{ display: "flex", gap: 2 }}>
            <i style={{ width: 10, height: 22, background: "#1fb8d8", borderRadius: 2 }} />
            <i style={{ width: 6, height: 22, background: "#3dffa0", borderRadius: 2 }} />
            <i style={{ width: 10, height: 10, background: "#ff4fd8", borderRadius: 2, alignSelf: "flex-start" }} />
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.25 }}>
            <b>{user.nickname}</b>
            <br />
            <span style={{ opacity: 0.7 }}>{ui.badge}</span>
          </div>
        </div>
        {city && <div className="zg-pn" style={{ padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#3dffa0" }}>{online} online</div>}
      </div>

      <div className="zg-a" style={{ right: 18, top: 14, display: "flex", gap: 8, alignItems: "center" }}>
        {city && (
          <>
            <button className="zg-b" onClick={() => game.toggleMenu("trav")}>Travel (M)</button>
            <button className="zg-b" onClick={() => game.toggleMenu("opt")}>Options (O)</button>
            <button className="zg-b" onClick={() => game.toggleMenu("players")}>Players (P)</button>
          </>
        )}
        {ui.mode !== "tour" && <button className="zg-b" onClick={() => void game.startTour()}>▶ Cinematic tour</button>}
        {city && <button className="zg-b" onClick={() => void game.toGlobe()}>Earth</button>}
        {city && <button className="zg-b" onClick={() => game.respawn()}>Reset</button>}
        <div className="menuwrap">
          <button className="zg-b" onClick={() => setMenu(!menu)}>{user.nickname} ▾</button>
          {menu && (
            <div className="menu">
              <button onClick={() => onQuality(quality === "high" ? "low" : "high")}>Quality: {quality} (lower resolution, nearer fog)</button>
              <button onClick={onLeave}>Leave plaza (keep my guest identity)</button>
              <button onClick={onSignOut}>Sign out (forget this guest)</button>
              <p className="fine">Leaving disconnects you but keeps your session, so you can return as the same person. Signing out ends the session; a guest identity cannot be recovered afterwards.</p>
            </div>
          )}
        </div>
      </div>

      {/* Earth picker */}
      {ui.mode === "globe" && (
        <div className="zg-a zg-pn" style={{ left: 18, bottom: 18, width: 290, padding: 16 }}>
          <div style={{ font: "600 11px ui-monospace,monospace", opacity: 0.65, letterSpacing: ".1em" }}>EARTH, ALTERNATE</div>
          <h2 style={{ fontSize: 18, margin: "6px 0 8px" }}>Pick a city</h2>
          <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9 }}>
            {ui.globeSel ? (
              <>
                <b style={{ color: ui.globeSel.ok ? "#3dffa0" : "#4de8ff" }}>{ui.globeSel.n}</b>
                <br />
                {ui.globeSel.d}
              </>
            ) : (
              <>Drag to rotate · scroll to zoom · click a glowing pin. Only <b style={{ color: "#3dffa0" }}>Genesis City</b> is open — the rest are blueprints.</>
            )}
          </div>
          {ui.globeSel?.ok && (
            <div style={{ marginTop: 12 }}>
              <button className="zg-b pri" onClick={() => void game.enterCity()}>Enter Genesis City ▸</button>
            </div>
          )}
        </div>
      )}

      {city && (
        <>
          {ui.toast && (
            <div key={ui.toast.n} className="zg-a zg-pn zg-toast">
              <b>{ui.toast.a}</b>
              {ui.toast.b && (
                <>
                  <br />
                  <span style={{ fontSize: 12, opacity: 0.75 }}>{ui.toast.b}</span>
                </>
              )}
            </div>
          )}
          <div className="zg-a zg-pn mm-wrap"><Minimap game={game} /></div>

          {ui.prompt && (
            <div className="zg-a zg-pn" style={{ left: "50%", bottom: 90, transform: "translateX(-50%)", padding: "9px 18px", fontSize: 14, fontWeight: 600, pointerEvents: "none" }}>
              <span className="zg-k">E</span>{ui.prompt}
            </div>
          )}

          {!ui.helpHidden && (
            <div className="zg-a zg-pn" style={{ left: 18, bottom: 18, padding: "10px 14px", fontSize: 12, lineHeight: 1.9, maxWidth: 430, pointerEvents: "none" }}>
              <span className="zg-k">WASD</span>move <span className="zg-k">Shift</span>sprint <span className="zg-k">Space</span>jump <span className="zg-k">E</span>interact
              <br />
              <span className="zg-k">drag</span>look <span className="zg-k">M</span>travel <span className="zg-k">O</span>options <span className="zg-k">V</span>camera <span className="zg-k">P</span>players <span className="zg-k">Enter</span>chat
            </div>
          )}

          <div className="zg-a zg-pn" style={{ right: 18, top: 292, width: 224, padding: "10px 12px", fontSize: 12, lineHeight: 1.7 }}>
            <div style={{ font: "700 10px ui-monospace,monospace", letterSpacing: ".1em", opacity: 0.6, marginBottom: 2 }}>DISCOVERIES</div>
            <Row ok={d.done} a="Shiba bones" b={d.done ? "✓ badge" : `${d.bones}/3`} />
            <Row ok={d.ringDone} a="Ring Run" b={d.ringDone ? "✓ rainbow wheels" : `${d.ring}/5`} />
            <Row ok={d.launch} a="Launch spotter" b={d.launch ? "✓ spark halo" : "telescope"} />
            <Row ok={d.buddy} a="Penguin trail" b={d.buddy ? "✓ found door" : "follow (F)"} />
            <div className="zg-sm" style={{ marginTop: 4 }}>Local to this tab: no rewards are stored or issued.</div>
          </div>

          {route && (
            <div className="zg-a zg-pn" style={{ left: "50%", top: 66, transform: "translateX(-50%)", padding: "6px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{ display: "inline-block", fontSize: 18, color: "#3dffa0" }}>▲</span>
              <b>{route.label}</b>
              <span style={{ opacity: 0.7 }}>{dist(route.cx, route.cz)} m</span>
              <button className="zg-ch" onClick={() => game.clearRoute()}>clear</button>
            </div>
          )}

          {ui.arrive && !ui.menu && (
            <div className="zg-a zg-pn" style={{ left: 18, top: 78, width: 290, padding: 14, background: "rgba(18,12,48,.9)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: 15 }}>Welcome to Genesis Square</h2>
                <button className="zg-ch" onClick={() => game.dismissArrive()}>✕</button>
              </div>
              <div className="zg-sm" style={{ margin: "6px 0 10px" }}>What brings you here? Pick one — or just wander.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="zg-b pri" onClick={() => game.arriveChoice("act")}>Join an activity</button>
                <button className="zg-b" onClick={() => game.arriveChoice("comm")}>Discover communities</button>
                <button className="zg-b" onClick={() => game.arriveChoice("explore")}>Explore</button>
              </div>
            </div>
          )}

          {ui.menu === "trav" && (
            <div className="zg-a zg-pn zg-side" style={{ width: 310 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 16 }}>Travel</h2>
                <button className="zg-b" onClick={() => game.closeMenus()}>Close</button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
                {CATS.map(([id, label]) => (
                  <button key={id} className={`zg-ch ${ui.travFilter === id ? "on" : ""}`} onClick={() => game.setTravFilter(id)}>{label}</button>
                ))}
              </div>
              <div style={{ position: "sticky", top: -14, zIndex: 2, background: "rgba(18,12,48,.97)", padding: "6px 0 8px", marginBottom: 6 }}>
                {sel && list.includes(sel) ? (
                  <>
                    <div style={{ fontSize: 13, marginBottom: 6 }}>Selected: <b style={{ color: sel.color }}>{sel.label}</b></div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="zg-b pri" onClick={() => void game.teleportTo(sel)}>Teleport now</button>
                      <button className="zg-b" onClick={() => game.walkRoute()}>Walk — route shown</button>
                    </div>
                  </>
                ) : (
                  <div className="zg-sm">Click a destination, then press <b>Teleport now</b> (or double-click it). Its route is highlighted green.</div>
                )}
              </div>
              {list.map((p) => (
                <button key={p.id} className={`zg-it ${ui.selId === p.id ? "on" : ""}`} onClick={() => game.selectDest(p.id)} onDoubleClick={() => void game.teleportTo(p)}>
                  <span style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <b style={{ color: p.color }}>{p.label}</b>
                    <span className="zg-sm">{dist(p.cx, p.cz)} m</span>
                  </span>
                  <span className="zg-sm">{p.tag}</span>
                </button>
              ))}
            </div>
          )}

          {ui.menu === "opt" && (
            <div className="zg-a zg-pn zg-side" style={{ width: 330 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 16 }}>Options</h2>
                <button className="zg-b" onClick={() => game.closeMenus()}>Close</button>
              </div>
              <label className="zg-row"><span>Look sensitivity X</span><input type="range" min=".3" max="2.2" step=".05" value={O.sensX} onChange={(e) => game.setOpt("sensX", parseFloat(e.target.value))} /></label>
              <label className="zg-row"><span>Look sensitivity Y</span><input type="range" min=".3" max="2.2" step=".05" value={O.sensY} onChange={(e) => game.setOpt("sensY", parseFloat(e.target.value))} /></label>
              <label className="zg-row"><span>Invert vertical look</span><input type="checkbox" checked={O.invertY} onChange={(e) => game.setOpt("invertY", e.target.checked)} /></label>
              <label className="zg-row"><span>Auto-recenter camera</span><input type="checkbox" checked={O.recenter} onChange={(e) => game.setOpt("recenter", e.target.checked)} /></label>
              <label className="zg-row"><span>Capture mouse (click scene)</span><input type="checkbox" checked={O.capture} onChange={(e) => game.setOpt("capture", e.target.checked)} /></label>
              <div className="zg-sm">Capture mode locks the pointer for free look. <b>Press Esc to release it.</b> Default is drag-to-look.</div>
              <div style={{ font: "700 11px ui-monospace,monospace", letterSpacing: ".1em", opacity: 0.65, margin: "14px 0 2px" }}>AVATAR</div>
              <label className="zg-row"><span>Neon backpack</span><input type="checkbox" checked={O.pack} onChange={(e) => game.setOpt("pack", e.target.checked)} /></label>
              <label className="zg-row"><span>Spark halo <span className="zg-sm">(spot a launch)</span></span><input type="checkbox" checked={O.halo} disabled={!d.launch} onChange={(e) => game.setOpt("halo", e.target.checked)} /></label>
              <label className="zg-row"><span>Rainbow wheels <span className="zg-sm">(Ring Run)</span></span><input type="checkbox" checked={O.rainbow} disabled={!d.ringDone} onChange={(e) => game.setOpt("rainbow", e.target.checked)} /></label>
              <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
                <button className="zg-b" onClick={() => { game.C.resetCamera(); game.toast("Camera reset", ""); }}>Reset camera (V)</button>
                <button className="zg-b" onClick={() => { game.closeMenus(); game.respawn(); }}>Respawn (R)</button>
              </div>
              <div className="zg-sm">
                <b>W A S D</b> move relative to camera · <b>Shift</b> sprint · <b>Space</b> jump (brake on bike)
                <br />
                <b>drag</b> / <b>arrow keys</b> look · <b>E</b> mount / interact · <b>F</b> follow penguin
                <br />
                <b>M</b> travel · <b>O</b> options · <b>P</b> players · <b>Enter</b> chat · <b>T</b> tour · <b>G</b> Earth · <b>H</b> hide help · <b>F3</b> debug
                <br />
                <br />
                Everything is decided by the server (walls, speed, bikes), so it is the same for everyone. The walking crowd, the penguin, the unicorn and the discoveries are local scenery, not users.
              </div>
            </div>
          )}

          {ui.menu === "players" && (
            <div className="zg-a zg-pn zg-side" style={{ width: 310 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 16 }}>In this plaza ({players.length})</h2>
                <button className="zg-b" onClick={() => game.closeMenus()}>Close</button>
              </div>
              <div style={{ marginTop: 10 }}>
                {players.slice().sort((a, b) => a.dist - b.dist).map((p) => (
                  <button key={p.userId} className="zg-it" onClick={() => openProfile(p.userId)}>
                    <b>{p.name}{p.isSelf ? " (you)" : ""}</b>
                    <span className="zg-sm">
                      {p.kind === "npc" ? "BOT · server-controlled" : p.connected ? "Real person" : "Reconnecting…"} · {Math.round(p.dist)} m
                      {muted.has(p.userId) ? " · muted" : ""}
                      {blocked.has(p.userId) ? " · blocked" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="zg-a" style={{ right: 18, bottom: 18, width: 300 }}>
            {note && <div className="zg-pn note" style={{ padding: "6px 10px", fontSize: 12, marginBottom: 6 }}>{note}</div>}
            <div className="chat-log">
              {visible.length === 0 && <div className="dim">No messages yet. Press Enter to chat.</div>}
              {visible.map((m) => (
                <div key={m.id} className={m.npc ? "bot" : ""}>
                  <button onClick={() => !m.npc && openProfile(m.fromId)}>{m.name}{m.npc ? " [BOT]" : ""}</button>
                  {m.text}
                </div>
              ))}
            </div>
            <form onSubmit={send}>
              <input
                ref={inputRef}
                className="chat-in"
                maxLength={CHAT_MAX_LENGTH}
                placeholder="Enter to chat"
                onFocus={() => game.clearInput()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.code === "Escape") inputRef.current?.blur();
                }}
                autoComplete="off"
              />
            </form>
          </div>

          {ui.locked && <div className="zg-a zg-pn" style={{ left: "50%", bottom: 24, transform: "translateX(-50%)", padding: "7px 16px", fontSize: 13 }}>Mouse captured — press <b>Esc</b> to release</div>}
        </>
      )}

      {ui.mode === "tour" && (
        <>
          <div className="zg-a" style={{ left: "5vw", bottom: "11vh", maxWidth: 560, textShadow: "0 2px 18px #000", pointerEvents: "none" }}>
            {ui.tour.caption && (
              <>
                <div style={{ font: "600 12px ui-monospace,monospace", letterSpacing: ".14em", color: "#3dffa0", marginBottom: 6 }}>{ui.tour.caption.n}</div>
                <h2 style={{ fontSize: "clamp(22px,3.2vw,42px)" }}>{ui.tour.caption.a}</h2>
                <div style={{ fontSize: "clamp(14px,1.4vw,18px)", opacity: 0.9, marginTop: 8 }}>{ui.tour.caption.b}</div>
              </>
            )}
          </div>
          <div className="zg-a" style={{ right: "5vw", bottom: "9vh", display: "flex", gap: 8 }}>
            <button className="zg-b" onClick={() => game.tourPlayPause()}>{ui.tour.playing ? "❚❚" : "▶"}</button>
            <button className="zg-b" onClick={() => game.tourNext()}>Next ▸</button>
            <button className="zg-b" onClick={() => void game.exitTour()}>Exit tour</button>
          </div>
          <div className="zg-a" style={{ left: 0, bottom: 0, height: 3, background: "#3dffa0", width: `${Math.min(100, ui.tour.progress * 100)}%` }} />
        </>
      )}

      {ui.panel && (
        <div className="zg-a" style={{ inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(5,3,20,.5)" }}>
          <div className="zg-pn" style={{ width: "min(460px,88vw)", padding: 24, background: "rgba(22,14,56,.94)" }}>
            {/* First-party static copy authored in the Claude Design scripts (not user content). */}
            <h2 style={{ fontSize: 19, marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: ui.panel.title }} />
            <div style={{ fontSize: 14, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: ui.panel.html }} />
            <ul style={{ fontSize: 13, opacity: 0.9, paddingLeft: 18 }}>
              {ui.panel.list.map((x, i) => (
                <li key={i}><span dangerouslySetInnerHTML={{ __html: x }} /><span className="tag">Demo</span></li>
              ))}
            </ul>
            {ui.panel.links.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                {ui.panel.links.map((k) => (
                  <a key={k.u} className="zg-b" href={k.u} target="_blank" rel="noopener noreferrer">{k.t} ↗</a>
                ))}
              </div>
            )}
            <div className="zg-sm" style={{ marginTop: 10 }}>Illustrative content from the design. Nothing here is a live listing.</div>
            <button className="zg-b pri" style={{ marginTop: 14 }} onClick={() => game.closePanel()}>Close</button>
          </div>
        </div>
      )}

      {profile && (
        <div className="profile">
          <button className="x" onClick={() => setProfile(null)} aria-label="Close">×</button>
          {!profile.p && !profile.err && <p>Loading…</p>}
          {profile.err && <p className="err">{profile.err}</p>}
          {profile.p && (
            <>
              <h3>{profile.p.nickname}</h3>
              <div className="badges">
                <span className={`badge ${profile.p.isBot ? "bot" : ""}`}>{profile.p.isBot ? "BOT" : profile.p.kind === "wallet" ? "Wallet verified" : "Guest"}</span>
                {!profile.p.isBot && <span className="badge">Real person</span>}
              </div>
              {profile.p.note && <p className="fine">{profile.p.note}</p>}
              {!profile.p.isBot && <p className="fine">Joined {new Date(profile.p.joinedAt).toLocaleDateString()} · wallet: not linked (wallet login arrives in Milestone 2)</p>}
              {profile.id !== conn.userId && (
                <div className="actions">
                  <button className="zg-b" onClick={() => conn.gotoPlayer(profile.id)}>Go to</button>
                  {!profile.p.isBot && (
                    <>
                      <button className="zg-b" onClick={() => toggleMute(profile.id)}>{muted.has(profile.id) ? "Unmute" : "Mute"}</button>
                      <button className="zg-b" onClick={() => conn.block(profile.id, !blocked.has(profile.id))}>{blocked.has(profile.id) ? "Unblock" : "Block"}</button>
                      <select aria-label="Report" value="" onChange={(e) => e.target.value && conn.report(profile.id, e.target.value)}>
                        <option value="">Report…</option>
                        {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {debug && stats && (
        <pre className="debug">
          {`fps ${stats.fps}  frame p95 ${stats.frameMsP95} ms\nrtt ${stats.rtt} ms  players ${stats.players}\npending steps ${stats.pending}\ncorrections ${stats.corrections}  max err ${stats.maxError} m\npos ${stats.pos.x.toFixed(1)}, ${stats.pos.z.toFixed(1)}\nquality ${quality}\ndraw calls ${stats.drawCalls}  tris ${stats.triangles}`}
        </pre>
      )}
      <div className={`zg-fade ${ui.fadeOn ? "on" : ""}`} />
    </div>
  );
}

function Row({ ok, a, b }: { ok: boolean; a: string; b: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", color: ok ? "#3dffa0" : undefined }}>
      <span>{a}</span>
      <span>{b}</span>
    </div>
  );
}
