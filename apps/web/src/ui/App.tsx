import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionUser } from "@thrillancer/contracts";
import { ApiError, api } from "../net/api";
import { PlazaConnection, type ConnStatus } from "../net/connection";
import { Game } from "../world/game";
import { loadDesign } from "../world/design";
import { Entry } from "./Entry";
import { Hud } from "./Hud";
import { prefs } from "./prefs";

type Phase = "boot" | "entry" | "joining" | "playing" | "failed" | "replaced";

export function App() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string>("");
  const [quality, setQualityState] = useState(prefs.quality());
  const [conn, setConn] = useState<PlazaConnection | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [connStatus, setConnStatus] = useState<ConnStatus>("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const connRef = useRef<PlazaConnection | null>(null);

  // Restore an existing guest session (the server-issued identity survives refresh).
  useEffect(() => {
    api
      .session()
      .then((r) => {
        setUser(r.user);
        setPhase("entry");
      })
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 401) setPhase("entry");
        else {
          setError(e instanceof Error ? e.message : "Cannot reach the server.");
          setPhase("failed");
        }
      });
  }, []);

  const teardown = useCallback(() => {
    gameRef.current?.dispose();
    gameRef.current = null;
    connRef.current?.leave();
    connRef.current = null;
    setGame(null);
    setConn(null);
  }, []);

  const enter = useCallback(
    async (nickname: string) => {
      setError("");
      setPhase("joining");
      try {
        const res = await api.guest(nickname);
        prefs.setNickname(res.user.nickname);
        setUser(res.user);
        teardown();
        const c = new PlazaConnection();
        connRef.current = c;
        c.on("status", (s, detail) => {
          setConnStatus(s);
          if (s === "failed") {
            setError(detail ?? "Connection failed.");
            setPhase("failed");
          } else if (s === "replaced") setPhase("replaced");
          else if (s === "idle" && connRef.current === c) setPhase("entry");
        });
        await c.connect();
        setConn(c);
        setPhase("playing");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not enter the plaza.");
        setPhase("failed");
      }
    },
    [teardown],
  );

  // Create the renderer once the canvas exists and we are connected.
  useEffect(() => {
    if (phase !== "playing" || !conn || !canvasRef.current || gameRef.current) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    loadDesign()
      .then((Z) => {
        if (cancelled || gameRef.current) return;
        const g = new Game(canvas, conn, quality, Z);
        gameRef.current = g;
        setGame(g);
        (window as unknown as { __zg?: unknown }).__zg = {
          game: g,
          stats: () => g.stats(),
          players: () => g.playerViews(),
          conn: () => ({ status: conn.status, userId: conn.userId, rtt: conn.rtt }),
          // Dev-only fault injection for the reconnect test: abruptly closes the socket without a consented leave.
          ...(import.meta.env.DEV ? { view: (y: number, p: number, d: number) => g.setView(y, p, d), dropSocket: () => (conn.room as unknown as { connection: { transport: { ws: WebSocket } } }).connection.transport.ws.close() } : {}),
        };
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Could not load the world.");
        setPhase("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [phase, conn, quality]);

  useEffect(() => () => teardown(), [teardown]);

  const setQuality = (q: "high" | "low") => {
    prefs.setQuality(q);
    setQualityState(q);
    gameRef.current?.setQuality(q);
  };

  const leave = () => {
    teardown();
    setPhase("entry");
  };
  const signOut = async () => {
    teardown();
    try {
      await api.signOut();
    } catch {
      /* cookie will expire; nothing else to do */
    }
    setUser(null);
    setPhase("entry");
  };

  const retry = () => {
    if (user) void enter(user.nickname);
    else {
      setError("");
      setPhase("entry");
    }
  };

  const inWorld = phase === "playing" || (phase === "failed" && !!game) || phase === "replaced";

  return (
    <>
      <canvas ref={canvasRef} className={`stage ${inWorld ? "" : "stage-hidden"}`} />
      {phase === "boot" && <Splash text="Contacting the plaza…" />}
      {phase === "joining" && <Splash text="Entering the plaza…" />}
      {phase === "entry" && <Entry user={user} quality={quality} onQuality={setQuality} onEnter={enter} onSignOut={signOut} error={error} />}
      {phase === "failed" && (
        <Splash text={error || "Something went wrong."} tone="error">
          <div className="row">
            <button className="btn primary" onClick={retry}>
              Retry
            </button>
            <button className="btn" onClick={leave}>
              Back to start
            </button>
          </div>
        </Splash>
      )}
      {phase === "replaced" && (
        <Splash text="You entered the plaza from another tab or device, so this one was disconnected." tone="warn">
          <div className="row">
            <button className="btn primary" onClick={() => user && void enter(user.nickname)}>
              Take this tab back
            </button>
            <button className="btn" onClick={leave}>
              Close
            </button>
          </div>
        </Splash>
      )}
      {phase === "playing" && conn && game && user && (
        <Hud conn={conn} game={game} user={user} status={connStatus} quality={quality} onQuality={setQuality} onLeave={leave} onSignOut={signOut} />
      )}
    </>
  );
}

function Splash({ text, tone, children }: { text: string; tone?: "error" | "warn"; children?: React.ReactNode }) {
  return (
    <div className="splash">
      <div className={`splash-card ${tone ?? ""}`}>
        {!tone && <div className="spinner" />}
        <p>{text}</p>
        {children}
      </div>
    </div>
  );
}
