import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

type Screen =
  | "home"
  | "register"
  | "instructions"
  | "quiz"
  | "submitted"
  | "leaderboard"
  | "winner"
  | "login"
  | "dashboard"
  | "competitions"
  | "create"
  | "edit"
  | "questions"
  | "upload"
  | "live"
  | "participants"
  | "winners"
  | "reports"
  | "settings";

type IconName =
  | "arrow"
  | "check"
  | "clock"
  | "trophy"
  | "users"
  | "chart"
  | "grid"
  | "menu"
  | "plus"
  | "search"
  | "upload"
  | "file"
  | "eye"
  | "settings"
  | "logout"
  | "shield"
  | "bell"
  | "chevron"
  | "close"
  | "download"
  | "edit"
  | "trash"
  | "play";

type ThemeContextValue = { theme: "light" | "dark"; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue>({ theme: "light", toggleTheme: () => {} });

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const dark = theme === "dark";
  return <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} mode`} title={`Switch to ${dark ? "light" : "dark"} mode`}><span aria-hidden="true">{dark ? "☀" : "☾"}</span><b>{dark ? "Light" : "Dark"}</b></button>;
}

const paths: Record<IconName, React.ReactNode> = {
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5v2a3 3 0 0 0 3 3m8-5h3v2a3 3 0 0 1-3 3M12 13v4m-4 3h8" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M18 8a4 4 0 0 1 0 7m4 5v-2a4 4 0 0 0-3-3.8" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4m-5 5 5-5 5 5" />
      <path d="M5 14v5h14v-5" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v5h5M9 13h6m-6 4h6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7L10.5 2h-3l-.7 2-1.7.7-1.9-.9L1.1 6l.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2h3l.7-2 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7 2-.5Z"
        transform="translate(2) scale(.9)"
      />
    </>
  ),
  logout: (
    <>
      <path d="M10 17l5-5-5-5m5 5H3" />
      <path d="M14 4h6v16h-6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4 6v5c0 5 3 8 8 10 5-2 8-5 8-10V6l-8-3Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8Z" />
      <path d="M10 20h4" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  download: (
    <>
      <path d="M12 4v12m-5-5 5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  edit: (
    <>
      <path d="m4 16-1 5 5-1L19 9l-4-4L4 16Z" />
      <path d="m13 7 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7" />
      <path d="M10 11v6m4-6v6" />
    </>
  ),
  play: <path d="m8 5 11 7-11 7V5Z" />,
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Logo({ dark = false, brandName = "John quiz.com" }: { dark?: boolean; brandName?: string }) {
  return (
    <button className="logo" onClick={() => go("home")} aria-label="John quiz.com home">
      <span className="logo-mark">
        <Icon name="trophy" size={20} />
      </span>
      <span className={dark ? "text-white" : ""}>{brandName}</span>
    </button>
  );
}

let globalGo: (screen: Screen) => void = () => {};
const go = (screen: Screen) => globalGo(screen);
async function adminFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.status === 401) {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminEmail");
    go("login");
  }
  return response;
}
let selectedEntryCode = "";
let selectedCompetitionId = "";

const participant = { id: "", name: "", username: "", phone: "", classLevel: "", questionCount: 20, durationMinutes: 10, competitionTitle: "The Ultimate Knowledge Sprint", prize: "₵2,500", quizQuestions: [] as Array<{ id: string; q: string; type?: string }>, startedAt: 0, answers: {} as Record<number, string>, score: 0, elapsed: 0, submittedAt: "" };

type PublicCompetition = { id: string; title: string; description: string; questionCount: number; durationMinutes: number; maxParticipants: number; prize: string; entryCode?: string; isPublished: boolean; isLocked?: boolean; lockReason?: string; status: string; rules?: string; startAt?: string | null; endAt?: string | null; participantCount?: number };
const defaultPublicCompetition: PublicCompetition = { id: "00000000-0000-4000-8000-000000000048", title: "The Ultimate Knowledge Sprint", description: "Law students · Legal reasoning", questionCount: 20, durationMinutes: 10, maxParticipants: 1000, prize: "₵2,500", entryCode: "JQ-000048", isPublished: true, status: "Live", rules: "Answer each question in writing. Highest score wins; ties are broken by fastest completion time." };

type PublicHomePayload = { competition: PublicCompetition; participants: number; submissions: number; competitions: PublicCompetition[]; settings: { platformName: string; supportEmail: string } };
let publicHomeCache: { data: PublicHomePayload; expiresAt: number } | null = null;
let publicHomeRequest: Promise<PublicHomePayload> | null = null;
function readPublicHomeCache(): PublicHomePayload | null {
  try {
    const value = localStorage.getItem("johnQuizPublicHome");
    if (!value) return null;
    const data = JSON.parse(value) as PublicHomePayload;
    return data?.competition?.id && Array.isArray(data.competitions) && data?.settings?.platformName ? data : null;
  } catch { return null; }
}
function fetchPublicHome(forceRefresh = false) {
  if (!forceRefresh && publicHomeCache && publicHomeCache.expiresAt > Date.now()) return Promise.resolve(publicHomeCache.data);
  if (publicHomeRequest) return publicHomeRequest;
  publicHomeRequest = fetch("/api/public/home").then((response) => response.ok ? response.json() : Promise.reject())
    .then((data: PublicHomePayload) => {
      publicHomeCache = { data, expiresAt: Date.now() + 2000 };
      try { localStorage.setItem("johnQuizPublicHome", JSON.stringify(data)); } catch {}
      return data;
    })
    .finally(() => { publicHomeRequest = null; });
  return publicHomeRequest;
}

function usePublicCompetition() {
  const [data, setData] = useState(() => {
    const cached = readPublicHomeCache();
    return cached
      ? { competition: cached.competition, participants: cached.participants, submissions: cached.submissions, loaded: true }
      : { competition: defaultPublicCompetition, participants: 0, submissions: 0, loaded: false };
  });
  useEffect(() => {
    let active = true;
    const refresh = () => fetchPublicHome(true)
      .then((result) => { if (active) setData({ competition: result.competition, participants: result.participants, submissions: result.submissions, loaded: true }); })
      .catch(() => { if (active) setData((old) => ({ ...old, loaded: true })); });
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 30000);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, []);
  return data;
}

function usePublicCompetitions() {
  const [items, setItems] = useState<PublicCompetition[]>(() => readPublicHomeCache()?.competitions || []);
  const [loaded, setLoaded] = useState(() => Boolean(readPublicHomeCache()));
  useEffect(() => {
    let active = true;
    const refresh = () => fetchPublicHome(true)
      .then((data) => { if (active) { setItems(data.competitions || []); setLoaded(true); } })
      .catch(() => { if (active) setLoaded(true); });
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 30000);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, []);
  return { items, loaded };
}

function EventCountdown({ event }: { event?: Pick<PublicCompetition, "startAt" | "endAt" | "status"> }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!event?.startAt && !event?.endAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [event?.startAt, event?.endAt]);
  if (!event) return <span>Loading window…</span>;
  const start = event.startAt ? new Date(event.startAt).getTime() : null;
  const end = event.endAt ? new Date(event.endAt).getTime() : null;
  const remaining = (milliseconds: number) => {
    const total = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return days ? `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m` : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };
  if (event.status === "completed" || (end !== null && now >= end)) return <span>Event closed</span>;
  if (start !== null && now < start) return <span>Starts in {remaining(start - now)}</span>;
  if (end !== null) return <span>Closes in {remaining(end - now)}</span>;
  return <span>Open now · no closing time</span>;
}

function Button({
  children,
  kind = "primary",
  icon,
  onClick,
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  kind?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button type={type} className={`btn btn-${kind}`} onClick={onClick} disabled={disabled}>
      {children}
      {icon && <Icon name={icon} />}
    </button>
  );
}

function participantInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "U";
  return `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : words[0][1] || ""}`.toUpperCase();
}

function PublicHeader({ brandName, userName }: { brandName: string; userName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="public-header">
      <div className="public-nav">
        <Logo brandName={brandName} />
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <Icon name={open ? "close" : "menu"} />
        </button>
        <nav className={open ? "open" : ""}>
          <button onClick={() => go("home")}>Home</button>
          <button
            onClick={() => {
              go("home");
              setTimeout(
                () => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }),
                50,
              );
            }}
          >
            How it works
          </button>
          <button onClick={() => go("register")}>Current competition</button>
          <button onClick={() => go("leaderboard")}>Leaderboard</button>
        </nav>
        <ThemeToggle />
        {userName && <div className="public-user"><span>{participantInitials(userName)}</span><b>{userName}</b></div>}
      </div>
    </header>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(() => readPublicHomeCache()?.settings || { platformName: "John quiz.com", supportEmail: "hello@johnquiz.com" });
  const [userName] = useState(() => participant.name || sessionStorage.getItem("participantName") || sessionStorage.getItem("userUsername") || "");
  useEffect(() => {
    fetchPublicHome()
      .then((data) => setSettings(data.settings)).catch(() => {});
  }, []);
  return (
    <div>
      <PublicHeader brandName={settings.platformName} userName={userName} />
      {children}
      <footer>
        <div>
          <Logo dark brandName={settings.platformName} />
          <p>Fair competition. Fast thinking. Real rewards.</p>
          <small style={{ marginTop: "auto", color: "#667085" }}>
            Powered by <strong style={{ color: "#98a2b3" }}>LinvanX</strong>
          </small>
        </div>
        <div>
          <b>Platform</b>
          <button onClick={() => go("register")}>Current competition</button>
          <button onClick={() => go("leaderboard")}>Leaderboard</button>
        </div>
        <div>
          <b>Support</b>
          <span>{settings.supportEmail}</span>
          <span>Competition rules</span>
        </div>
        <div>
          <b>Follow</b>
          <span>LinkedIn · X · Instagram</span>
          <small>© 2026 John quiz.com</small>
          <small style={{ marginTop: "4px", color: "#98a2b3" }}>
            Powered by <strong style={{ color: "#ffffff", fontWeight: 600 }}>LinvanX</strong>
          </small>
        </div>
      </footer>
    </div>
  );
}

function Home() {
  const { competition: current, participants: participantCount, loaded } = usePublicCompetition();
  const { items: events, loaded: eventsLoaded } = usePublicCompetitions();
  const enterEvent = (code: string) => { selectedEntryCode = code; go("register"); };
  return (
    <PublicShell>
      <main className="home-page-backdrop">
        <section className="hero active-event-hero">
          <div className="hero-copy active-event-copy">
            <span className="eyebrow">
              <span className="live-dot" /> {!loaded ? "LOADING EVENT" : current.isLocked ? "UPCOMING EVENT" : "ACTIVE COMPETITION"}
            </span>
            <h1>
              {loaded ? current.title : "Your next quiz"}
            </h1>
            <p>
              {loaded ? current.description || "Your active competition is ready. Review the event details and join when the event is open." : "Loading the active competition and its entry details…"}
            </p>
            <div className="button-row">
              <Button icon="arrow" disabled={!loaded || current.isLocked} onClick={() => enterEvent(current.entryCode || "")}>
                {loaded && current.isLocked ? "Event locked" : "Enter active competition"}
              </Button>
              <Button kind="ghost" onClick={() => go("leaderboard")}>
                View leaderboard
              </Button>
            </div>
            <div className="trust-row">
              <span>
                <Icon name="file" /> {loaded ? `${current.questionCount} questions` : "Questions —"}
              </span>
              <span>
                <Icon name="clock" /> {loaded ? `${current.durationMinutes} minutes` : "Duration —"}
              </span>
              <span>
                <Icon name="users" /> {loaded ? `${participantCount} players` : "Players —"}
              </span>
            </div>
          </div>
          <div className="hero-card-wrap">
            <div className="prize-orbit">₵</div>
            <div className="competition-card">
              <div className="card-top">
                <span className="status-live">{loaded ? current.status.toUpperCase() : "LOADING"}</span>
                <span>{loaded ? `${current.questionCount} questions · ${current.durationMinutes} minutes` : "Loading event details…"}</span>
              </div>
              <div className="quiz-badge">
                <Icon name="trophy" size={30} />
              </div>
              <small>ACTIVE COMPETITION</small>
              <h2>{loaded ? current.title : "Loading current quiz…"}</h2>
              <p>{loaded ? current.description : "Your current event will appear here."}</p>
              <div className="prize-box">
                <span>WINNER TAKES</span>
                <strong>{loaded ? current.prize : "—"}</strong>
                <small>Cash prize</small>
              </div>
              <div className="featured-event-window"><small>EVENT WINDOW</small><b><EventCountdown event={current} /></b></div>
              <div className="card-bottom">
                <div>
                  <span className="avatars">{participantCount > 0 ? "PLAYERS" : "BE FIRST"}</span>
                  <b>{loaded ? `${participantCount} joined` : "Loading participants…"}</b>
                </div>
                <Button disabled={!loaded || current.isLocked} onClick={() => enterEvent(current.entryCode || "")}>{loaded && current.isLocked ? "Event locked" : "Enter now"}</Button>
              </div>
            </div>
          </div>
        </section>
        <section className="active-event-details" aria-label="Active competition details">
          <div className="active-details-heading">
            <span className="eyebrow"><Icon name="shield" /> YOUR EVENT BRIEFING</span>
            <h2>Everything you need before you play</h2>
            <p>Check the event window, entry code and quiz rules before starting.</p>
          </div>
          <div className="active-details-panel surface">
            <div className="active-detail-stats">
              <div className="active-detail-tile"><span>ENTRY CODE</span><b className="brief-code">{loaded ? current.entryCode || "Not set" : "Loading…"}</b><small>Use this code to join this competition</small></div>
              <div className="active-detail-tile"><span>EVENT WINDOW</span><b><EventCountdown event={current} /></b><small>{current.startAt ? `Opens ${new Date(current.startAt).toLocaleString()}` : "Entries are open now"}</small></div>
              <div className="active-detail-tile"><span>QUIZ FORMAT</span><b>{loaded ? `${current.questionCount} questions` : "Loading…"}</b><small>{loaded ? `${current.durationMinutes} minutes to complete` : "Quiz duration loading"}</small></div>
              <div className="active-detail-tile"><span>PLAYERS</span><b>{loaded ? `${participantCount} joined` : "Loading…"}</b><small>{loaded ? `${Math.max(0, current.maxParticipants - participantCount)} places remaining` : "Competition capacity"}</small></div>
            </div>
            <div className="active-rules-row">
              <div><span>PRIZE</span><b>{loaded ? current.prize : "Loading…"}</b></div>
              <div className="active-rules-copy"><span>COMPETITION RULES</span><p>{current.rules || "Answer every question before the timer ends. Your score is recorded when you submit."}</p></div>
              <Button disabled={!loaded || current.isLocked} onClick={() => enterEvent(current.entryCode || "")}>{loaded && current.isLocked ? "Event locked" : "Join this competition"}</Button>
            </div>
          </div>
        </section>
        <section className="section available-events" id="events">
          <div className="section-heading">
            <span>QUIZ EVENTS</span>
            <h2>Available quiz events</h2>
            <p>Choose a competition and keep its unique entry code ready to join.</p>
          </div>
          {!eventsLoaded ? <div className="event-grid event-grid-loading" aria-label="Loading quiz events"><div className="surface event-skeleton"/><div className="surface event-skeleton"/><div className="surface event-skeleton"/></div> : events.length ? <div className="event-grid">
            {events.map((event) => <article className="surface event-card" key={event.id}>
              <div className="event-card-top"><span className={`pill ${event.isLocked ? "orange" : "green"}`}>{event.isLocked ? "Locked" : "Open now"}</span><span>{event.participantCount || 0} joined</span></div>
              <h3>{event.title}</h3><p>{event.description || "A John quiz.com competition"}</p>
              <div className="event-facts"><span>{event.questionCount} questions</span><span>{event.durationMinutes} min</span><strong>{event.prize || "Prize announced soon"}</strong></div>
              <div className="event-window"><small>EVENT WINDOW</small><b><EventCountdown event={event} /></b></div>
              {event.lockReason && <p className="event-lock-reason">{event.lockReason}</p>}
              <div className="event-code"><small>ENTRY CODE</small><b>{event.entryCode || "—"}</b></div>
              <Button disabled={event.isLocked} onClick={() => enterEvent(event.entryCode || "")}>{event.isLocked ? "Event locked" : "Join this event"}</Button>
            </article>)}
          </div> : <div className="surface events-empty"><Icon name="trophy"/><h3>No published events yet</h3><p>Check back soon for the next quiz competition.</p></div>}
        </section>
        <section className="prize-strip">
          <span>THIS WEEK'S PRIZE</span>
          <strong>{loaded ? current.prize : "Loading…"}</strong>
          <p>Plus champion badge, leaderboard feature and ultimate bragging rights.</p>
          <Button kind="secondary" onClick={() => go("register")}>
            Compete now
          </Button>
        </section>
        <section className="section" id="how">
          <div className="section-heading">
            <span>FOUR SIMPLE STEPS</span>
            <h2>Your path to the podium</h2>
            <p>No complicated sign-up. Just bring your knowledge and your fastest thinking.</p>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Enter your name",
                "Tell us who you are so your score is officially recorded.",
              ],
              ["02", "Start the quiz", "Review the rules, then start when you are ready."],
              ["03", "Beat the clock", "Choose carefully—accuracy comes first, then speed."],
              ["04", "Claim your prize", "Top the verified leaderboard and become champion."],
            ].map((s, i) => (
              <div className="step" key={s[0]}>
                <span>{s[0]}</span>
                <div className="step-icon">
                  <Icon
                    name={i === 0 ? "users" : i === 1 ? "play" : i === 2 ? "clock" : "trophy"}
                  />
                </div>
                <h3>{s[1]}</h3>
                <p>{s[2]}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="winner-band">
          <div>
            <span className="eyebrow light">CURRENT COMPETITION</span>
            <h2>
              Earn your place
              <br />
              on the leaderboard.
            </h2>
            <p>{current.title} · {participantCount} participants registered so far.</p>
            <Button kind="secondary" onClick={() => go("leaderboard")}>
              View verified standings
            </Button>
          </div>
          <div className="winner-card">
            <div className="winner-avatar"><Icon name="trophy" /></div>
            <div>
              <small>LIVE EVENT</small>
              <h3>{current.title}</h3>
              <p>{current.questionCount} questions · {current.durationMinutes} minutes</p>
            </div>
            <Icon name="trophy" size={40} />
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

function PageIntro({ step, title, copy }: { step?: string; title: string; copy: string }) {
  return (
    <div className="page-intro">
      {step && <span>{step}</span>}
      <h1>{title}</h1>
      <p>{copy}</p>
    </div>
  );
}

function Registration() {
  const [accountMode, setAccountMode] = useState<"signup" | "login">("signup");
  const [accountReady, setAccountReady] = useState(() => Boolean(sessionStorage.getItem("userToken")));
  const [accountUsername, setAccountUsername] = useState(() => sessionStorage.getItem("userUsername") || "");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [name, setName] = useState(() => sessionStorage.getItem("participantName") || "");
  const [phone, setPhone] = useState(() => sessionStorage.getItem("userPhone") || "");
  const [classLevel, setClassLevel] = useState(() => sessionStorage.getItem("userClassLevel") || "");
  const [entryCode, setEntryCode] = useState(selectedEntryCode);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { competition: currentCompetition, loaded: competitionLoaded } = usePublicCompetition();
  useEffect(() => { if (!entryCode && competitionLoaded && currentCompetition.entryCode) setEntryCode(currentCompetition.entryCode); }, [entryCode, competitionLoaded, currentCompetition.entryCode]);
  useEffect(() => {
    const token = sessionStorage.getItem("userToken");
    if (!token) return;
    fetch("/api/account/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        setAccountUsername(data.account.username);
        setPhone(data.account.phone || "");
        setClassLevel(data.account.classLevel || "");
        setAccountReady(true);
      })
      .catch(() => { sessionStorage.removeItem("userToken"); sessionStorage.removeItem("userUsername"); sessionStorage.removeItem("userEmail"); setAccountReady(false); });
  }, []);
  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/account/${accountMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: accountUsername, password, phone, classLevel }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      sessionStorage.setItem("userToken", result.token);
      sessionStorage.setItem("userUsername", result.account.username);
      sessionStorage.setItem("userPhone", result.account.phone || "");
      sessionStorage.setItem("userClassLevel", result.account.classLevel || "");
      setAccountUsername(result.account.username);
      setPhone(result.account.phone || "");
      setClassLevel(result.account.classLevel || "");
      setPassword(""); setAccountReady(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not reach the server."); }
    finally { setBusy(false); }
  }
  async function registerParticipant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("userToken") || ""}` },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), classLevel: classLevel.trim(), entryCode: entryCode.trim() }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) { sessionStorage.removeItem("userToken"); sessionStorage.removeItem("userUsername"); sessionStorage.removeItem("userEmail"); setAccountReady(false); }
        throw new Error(result.error || "Registration failed.");
      }
      participant.id = result.participant.id;
      participant.name = result.participant.name;
      participant.username = accountUsername;
      sessionStorage.setItem("participantName", participant.name);
      participant.phone = phone;
      participant.classLevel = classLevel;
      sessionStorage.setItem("userPhone", phone);
      sessionStorage.setItem("userClassLevel", classLevel);
      participant.questionCount = result.competition?.questionCount || 20;
      participant.quizQuestions = result.questions || [];
      participant.durationMinutes = result.competition?.durationMinutes || 10;
      participant.competitionTitle = result.competition?.title || "The Ultimate Knowledge Sprint";
      participant.prize = result.competition?.prize || "₵2,500";
      selectedEntryCode = "";
      go("instructions");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not register for this event."); }
    finally { setBusy(false); }
  }
  return (
    <PublicShell>
      <main className="center-page">
        <div className="form-layout">
          <div>
            <PageIntro
              step="PLAYER ACCOUNT"
              title={accountReady ? "Finish your competition entry." : accountMode === "signup" ? "Create your player account." : "Welcome back."}
              copy={accountReady ? "Confirm your player details and event code before starting the quiz." : "Create an account with a username, password, phone number and class or level."}
            />
            <div className="info-callout">
              <Icon name="shield" />
              <div>
                <b>Simple player sign-in</b>
                <p>Use your username and password to sign in. Your phone number and class or level are saved with your participant record.</p>
              </div>
            </div>
          </div>
          {!accountReady ? <form className="surface form-card account-form" onSubmit={authenticate}>
            <div className="account-tabs"><button type="button" className={accountMode === "signup" ? "active" : ""} onClick={() => { setAccountMode("signup"); setError(""); }}>Create account</button><button type="button" className={accountMode === "login" ? "active" : ""} onClick={() => { setAccountMode("login"); setError(""); }}>Sign in</button></div>
            <div className="form-title"><span className="form-icon"><Icon name="users" /></span><div><h2>{accountMode === "signup" ? "Your player account" : "Sign in to your account"}</h2><p>{accountMode === "signup" ? "Choose a username and add your contact details." : "Continue with your username and password."}</p></div></div>
            <label>Username *<input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_.-]{3,24}" autoComplete="username" value={accountUsername} onChange={(event) => setAccountUsername(event.target.value)} placeholder="e.g. jordan_24" /></label>
            <label>Password *<input required minLength={accountMode === "signup" ? 8 : undefined} type="password" autoComplete={accountMode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={accountMode === "signup" ? "At least 8 characters" : "Your password"} /></label>
            {accountMode === "signup" && <>
              <label>Phone number *<input required type="tel" autoComplete="tel" minLength={7} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+233 20 000 0000" /></label>
              <label>Class or level *<input required minLength={2} maxLength={60} value={classLevel} onChange={(event) => setClassLevel(event.target.value)} placeholder="e.g. JHS 2 or Level 100" /></label>
            </>}
            {error && <p className="form-error">{error}</p>}
            <Button type="submit" icon="arrow" disabled={busy}>{busy ? "Please wait…" : accountMode === "signup" ? "Create account and continue" : "Sign in and continue"}</Button>
            <small className="secure-note"><Icon name="shield" size={14} /> Your password is never displayed or stored in plain text.</small>
          </form> : <form className="surface form-card account-form" onSubmit={registerParticipant}>
            <div className="form-title"><span className="form-icon"><Icon name="users" /></span><div><h2>Participant details</h2><p>Signed in as @{accountUsername}</p></div></div>
            <div className="participant-profile-summary"><span>PLAYER PROFILE</span><b>@{accountUsername}</b><p>{phone || "Phone not set"} · {classLevel || "Class or level not set"}</p></div>
            <label>Full name *<input required minLength={2} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Jordan Williams" /></label>
            <label>Contact phone number *<input required type="tel" autoComplete="tel" minLength={7} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+233 20 000 0000" /><small className="field-hint">Saved to your player profile and visible to the administrator.</small></label>
            <label>Class or level *<input required minLength={2} maxLength={60} value={classLevel} onChange={(event) => setClassLevel(event.target.value)} placeholder="e.g. JHS 2 or Level 100" /></label>
            <label>Competition entry code *<input required value={entryCode} onChange={(event) => setEntryCode(event.target.value.toUpperCase())} placeholder="JQ-A1B2C3" /></label>
            <label className="checkbox"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I agree to the <u>competition rules</u> and consent to my score and abbreviated name appearing on the public leaderboard.</span></label>
            {error && <p className="form-error">{error}</p>}
            <Button type="submit" icon="arrow" disabled={busy || !name || !phone || !classLevel || !consent}>{busy ? "Saving entry…" : "Continue to instructions"}</Button>
            <button className="account-switch" type="button" onClick={() => { sessionStorage.removeItem("userToken"); sessionStorage.removeItem("userUsername"); sessionStorage.removeItem("userPhone"); sessionStorage.removeItem("userClassLevel"); sessionStorage.removeItem("participantName"); setAccountReady(false); setError(""); }}>Sign out of this account</button>
            <small className="secure-note"><Icon name="shield" size={14} /> Protected by encrypted submission and server-verified timing</small>
          </form>}
        </div>
      </main>
    </PublicShell>
  );
}

function Instructions() {
  const { competition: current } = usePublicCompetition();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (count === null) return;
    if (count <= 0) {
      go("quiz");
      return;
    }
    const t = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);
  return (
    <PublicShell>
      <main className="center-page instructions-page">
        <PageIntro
          step="STEP 2 OF 2"
          title="Read carefully. Then race the clock."
          copy="The timer starts immediately after the countdown. Make sure you have a stable internet connection."
        />
        <div className="surface instructions-card">
          <div className="instructions-head">
            <div>
              <span>FEATURED QUIZ</span>
              <h2>{current.title}</h2>
              <p>{current.description}</p>
            </div>
            <div className="prize-mini">
              <Icon name="trophy" />
              <span>
                PRIZE<strong>{current.prize}</strong>
              </span>
            </div>
          </div>
          <div className="quiz-facts">
            <div>
              <Icon name="file" />
              <span>
                Questions<strong>{current.questionCount}</strong>
              </span>
            </div>
            <div>
              <Icon name="clock" />
              <span>
                Time limit<strong>{current.durationMinutes} minutes</strong>
              </span>
            </div>
            <div>
              <Icon name="check" />
              <span>
                Answer type<strong>Single choice</strong>
              </span>
            </div>
          </div>
          <div className="rules">
            <h3>Competition rules</h3>
            {(current.rules || defaultPublicCompetition.rules || "").split("\n").filter(Boolean).map((r, i) => (
              <p key={r}>
                <span>{i + 1}</span>
                {r}
              </p>
            ))}
          </div>
          <div className="warning">
            <Icon name="clock" />
            <div>
              <b>Your timer begins after the 3-second countdown</b>
              <p>Closing or refreshing the page will not pause your timer.</p>
            </div>
          </div>
          <Button icon="play" onClick={() => setCount(3)}>
            I'm ready — start quiz
          </Button>
        </div>
        {count !== null && (
          <div className="modal-backdrop">
            <div className="countdown">
              <span>GET READY</span>
              <strong>{count || "GO"}</strong>
              <p>The clock is about to start</p>
            </div>
          </div>
        )}
      </main>
    </PublicShell>
  );
}

const lawFallbackQuestions = [
  { q: "What is the supreme law of Ghana?" },
  { q: "What standard of proof generally applies in Ghanaian civil cases?" },
  { q: "What standard of proof applies to criminal guilt?" },
  { q: "What is the principle that requires courts to follow binding earlier decisions?" },
  { q: "What is the binding legal reason for a court’s decision called?" },
  { q: "What is a judge’s non-binding observation outside the core reasoning called?" },
  { q: "What writ requires a detained person to be brought before a court?" },
  { q: "What is the presumption that an accused person is not guilty until proven otherwise?" },
  { q: "What is a civil wrong, apart from breach of contract, called?" },
  { q: "What is the legal term for a person who brings a civil claim?" },
  { q: "What is the legal term for the party against whom a civil claim is brought?" },
  { q: "What is a formal promise enforceable by law between parties called?" },
  { q: "What is the intentional or reckless creation of fear of immediate unlawful force called?" },
  { q: "What is the unlawful application of force to another person called?" },
  { q: "What is the defence that a person acted to protect themselves from imminent harm?" },
  { q: "What is the principle that no one should be a judge in their own cause?" },
  { q: "What Latin phrase means ‘hear the other side’?" },
  { q: "What is the legal process of resolving a dispute in court called?" },
  { q: "What is a court order requiring a person to do or stop doing something called?" },
  { q: "What doctrine prevents a matter already finally decided from being litigated again?" },
];


async function submitQuiz(answers: Record<number, string>) {
  participant.answers = answers;
  participant.elapsed = participant.startedAt ? Math.min(participant.durationMinutes * 60, Math.floor((Date.now() - participant.startedAt) / 1000)) : 0;
  const response = await fetch("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantId: participant.id, answers: Array.from({ length: participant.questionCount }, (_, index) => answers[index] ?? null), elapsedSeconds: participant.elapsed }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Your submission could not be saved.");
  participant.score = result.submission.score;
  participant.elapsed = result.submission.elapsedSeconds;
  participant.submittedAt = new Date(result.submission.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function Quiz() {
  const quizQuestions = participant.quizQuestions.length ? participant.quizQuestions : lawFallbackQuestions.slice(0, participant.questionCount).map((question, index) => ({ id: `fallback-${index}`, q: question.q }));
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(participant.answers);
  const answeredCount = Object.values(answers).filter((answer) => answer.trim().length > 0).length;
  const [time, setTime] = useState(participant.durationMinutes * 60);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!participant.startedAt) participant.startedAt = Date.now();
    const t = setInterval(
      () =>
        setTime((v) => {
          if (v <= 1) {
            clearInterval(t);
            void submitQuiz(participant.answers).then(() => go("submitted")).catch((error: Error) => window.alert(error.message));
            return 0;
          }
          return v - 1;
        }),
      1000,
    );
    return () => clearInterval(t);
  }, []);
  const submit = () => {
    void submitQuiz(answers).then(() => go("submitted")).catch((error: Error) => window.alert(error.message));
  };
  const mins = String(Math.floor(time / 60)).padStart(2, "0"),
    secs = String(time % 60).padStart(2, "0");
  return (
    <div className="quiz-screen">
      <header className="quiz-header">
        <Logo />
        <div className="quiz-person">
          <span>{participantInitials(participant.name)}</span>
          <div>
            <small>PARTICIPANT</small>
            <b>{participant.name || "Participant"}</b>
          </div>
        </div>
        <div className={`timer ${time < 120 ? "critical" : ""}`}>
          <Icon name="clock" />
          <span>
            TIME REMAINING
            <strong>
              {mins}:{secs}
            </strong>
          </span>
        </div>
      </header>
      <div className="quiz-progress">
        <div style={{ width: `${((current + 1) / quizQuestions.length) * 100}%` }} />
      </div>
      <main className="quiz-main">
        <aside className="question-nav">
          <div>
            <small>YOUR PROGRESS</small>
            <strong>
              {answeredCount}/{quizQuestions.length}
            </strong>
            <span>answered</span>
          </div>
          <div className="question-grid">
            {quizQuestions.map((_, i) => (
              <button
                className={`${i === current ? "active" : ""} ${answers[i]?.trim() ? "done" : ""}`}
                onClick={() => setCurrent(i)}
                key={i}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p>
            <span className="legend current" />
            Current <span className="legend answered" />
            Answered
          </p>
        </aside>
        <section className="question-panel">
          <div className="question-meta">
            <span>
              QUESTION {current + 1} OF {quizQuestions.length}
            </span>
            <span>WRITTEN ANSWER</span>
          </div>
          <h1>{quizQuestions[current].q}</h1>
          <p>Write a direct answer in your own words.</p>
          <label className="written-answer-field">
            <span>Your answer</span>
            <textarea
              rows={5}
              maxLength={2000}
              value={answers[current] || ""}
              onChange={(event) => {
                const next = { ...answers, [current]: event.target.value };
                setAnswers(next);
                participant.answers = next;
              }}
              placeholder="Type your answer here…"
            />
            <small>{(answers[current] || "").length}/2000 characters</small>
          </label>
          <div className="quiz-actions">
            <Button
              kind="ghost"
              onClick={() => setCurrent(Math.max(0, current - 1))}
              disabled={current === 0}
            >
              Previous
            </Button>
            {current < quizQuestions.length - 1 ? (
            <Button icon="arrow" onClick={() => { participant.answers = answers; setCurrent(current + 1); }}>
                Next question
              </Button>
            ) : (
              <Button icon="check" onClick={() => setConfirm(true)}>
                Submit quiz
              </Button>
            )}
          </div>
        </section>
      </main>
      {confirm && (
        <div className="modal-backdrop">
          <div className="modal">
            <button className="modal-close" onClick={() => setConfirm(false)}>
              <Icon name="close" />
            </button>
            <span className="modal-icon">
              <Icon name="shield" size={28} />
            </span>
            <h2>Submit your final answers?</h2>
            <p>
              You've answered{" "}
              <b>
                {answeredCount} of {quizQuestions.length}
              </b>{" "}
              questions. You won't be able to make changes after submitting.
            </p>
            <div className="modal-actions">
              <Button kind="ghost" onClick={() => setConfirm(false)}>
                Keep reviewing
              </Button>
              <Button onClick={submit}>Yes, submit quiz</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Submitted() {
  const duration = `${String(Math.floor(participant.elapsed / 60)).padStart(2, "0")}:${String(participant.elapsed % 60).padStart(2, "0")}`;
  return (
    <PublicShell>
      <main className="center-page success-page">
        <div className="success-mark">
          <Icon name="check" size={38} />
        </div>
        <span className="eyebrow">SUBMISSION VERIFIED</span>
        <h1>Great work{participant.name ? `, ${participant.name.split(" ")[0]}` : ""}!</h1>
        <p>Your answers have been submitted successfully. Good luck!</p>
        <div className="surface result-card">
          <div className="result-head">
            <div>
              <small>{participant.competitionTitle.toUpperCase()}</small>
              <h2>Submission receipt</h2>
            </div>
            <span className="verified">
              <Icon name="shield" /> Securely recorded
            </span>
          </div>
          <div className="result-grid">
            <div>
              <span>Correct answers</span>
              <strong>
                {participant.score} <small>/ {participant.questionCount}</small>
              </strong>
            </div>
            <div>
              <span>Completion time</span>
              <strong>{duration}</strong>
            </div>
            <div>
              <span>Submitted at</span>
              <strong>{participant.submittedAt || "Just now"}</strong>
            </div>
          </div>
          <div className="receipt-id">
            Submission ID <b>QCH-48-0847</b>
            <span>Final · Cannot be edited</span>
          </div>
        </div>
        <div className="privacy-note">
          <Icon name="eye" />
          <span>
            <b>Correct answers are hidden for now.</b> They’ll be revealed when the administrator
            closes the competition.
          </span>
        </div>
        <div className="button-row">
          <Button onClick={() => go("leaderboard")}>View live leaderboard</Button>
          <Button kind="ghost" onClick={() => go("home")}>
            Back to home
          </Button>
        </div>
      </main>
    </PublicShell>
  );
}

function Leaderboard() {
  const [sort, setSort] = useState<"rank" | "score" | "time">("rank");
  const [data, setData] = useState<{ competition: PublicCompetition; participants: number; perfectScores: number; timeRemainingSeconds: number | null; eventClosed: boolean; leaderboard: Array<{ name: string; initial: string; score: number; elapsedSeconds: number; submittedAt: string }> } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => fetch("/api/leaderboard")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => { if (active) { setData(result); setLoaded(true); setUpdatedAt(new Date()); } })
      .catch(() => { if (active) setLoaded(true); });
    void refresh();
    const interval = window.setInterval(refresh, 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);
  const formatDuration = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const rows = useMemo(() => {
    const mapped = (data?.leaderboard || []).map((row, index) => ({
      rank: index + 1,
      name: `${row.name}${row.initial ? ` ${row.initial}.` : ""}`,
      score: row.score,
      time: formatDuration(row.elapsedSeconds),
      status: index === 0 ? "Leading" : "Verified",
    }));
    return mapped.sort((a, b) => sort === "time" ? a.time.localeCompare(b.time) : sort === "score" ? b.score - a.score || a.time.localeCompare(b.time) : a.rank - b.rank);
  }, [sort, data]);
  const leader = rows[0];
  const competition = data?.competition;
  return (
    <PublicShell>
      <main className="leader-page">
        <div className="leader-hero">
          <span className="eyebrow light">
            <span className="live-dot" /> UPDATING LIVE
          </span>
          <h1>Champions rise here.</h1>
          <p>{competition?.title || (loaded ? "No current competition" : "Loading competition…")} · Ranked by score, then completion time.</p>
          <div className="leader-summary">
            <div>
              <span>PARTICIPANTS</span>
              <b>{data?.participants ?? (loaded ? 0 : "—")}</b>
            </div>
            <div>
              <span>PERFECT SCORES</span>
              <b>{data?.perfectScores ?? (loaded ? 0 : "—")}</b>
            </div>
            <div>
              <span>{competition?.startAt && new Date(competition.startAt).getTime() > Date.now() ? "EVENT OPENS" : "EVENT WINDOW"}</span>
              <b><EventCountdown event={competition} /></b>
            </div>
          </div>
        </div>
        <section className="leader-content">
          {leader ? <div className="winner-banner">
            <div className="winner-avatar gold">{participantInitials(leader.name)}</div>
            <div>
              <span>CURRENT LEADER</span>
              <h2>{leader.name}</h2>
              <p>{leader.score === competition?.questionCount ? "Perfect score" : "Highest recorded score"} · Fastest completion at this score</p>
            </div>
            <div className="winner-time"><Icon name="trophy" /><strong>{leader.score}/{competition?.questionCount || 20}</strong><span>{leader.time}</span></div>
          </div> : <div className="surface events-empty leaderboard-empty"><Icon name="chart"/><h3>{loaded ? "No submissions yet" : "Loading leaderboard…"}</h3><p>{loaded ? "The standings will appear here after participants complete this quiz." : "Fetching verified results for this event."}</p></div>}
          <div className="table-card">
            <div className="table-head">
              <div>
                <h2>Live standings</h2>
                <p>{updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : "Waiting for current results"}</p>
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                <option value="rank">Sort by rank</option>
                <option value="score">Sort by score</option>
                <option value="time">Sort by fastest</option>
              </select>
            </div>
            <div className="data-table public-table">
              <div className="tr th">
                <span>RANK</span>
                <span>PARTICIPANT</span>
                <span>CORRECT</span>
                <span>TIME</span>
                <span>STATUS</span>
              </div>
              {rows.map((r) => (
                <div className={`tr ${r.rank <= 3 ? "top-" + r.rank : ""}`} key={r.name}>
                  <span className="rank">
                    {r.rank === 1 ? <Icon name="trophy" /> : `#${r.rank}`}
                  </span>
                  <span>
                    <b>{r.name}</b>
                    <small>Verified participant</small>
                  </span>
                  <span>
                    <b>{r.score}/{competition?.questionCount || 20}</b>
                  </span>
                  <span className="mono">{r.time}</span>
                  <span>
                    <i className={r.rank === 1 ? "pill orange" : "pill green"}>{r.status}</i>
                  </span>
                </div>
              ))}
              {loaded && !rows.length && <div className="empty-state public-leaderboard-empty">No submissions have been saved for this competition yet.</div>}
            </div>
          </div>
          <p className="public-privacy">
            <Icon name="shield" /> Participant names are abbreviated. The administrator records the
            official winner separately.
          </p>
        </section>
      </main>
    </PublicShell>
  );
}

function WinnerPage() {
  const { competition, participants } = usePublicCompetition();
  return (
    <PublicShell>
      <main className="winner-page">
        <div className="confetti-lines" />
        <span className="eyebrow light">OFFICIAL RESULTS</span>
        <div className="big-trophy">
          <Icon name="trophy" size={54} />
        </div>
        <h1>Every quiz has its champions.</h1>
        <p>{competition.title} · {participants} participants registered</p>
        <div className="champion-card">
          <div className="winner-avatar xlarge"><Icon name="trophy" /></div>
          <span>WINNER ANNOUNCEMENTS</span>
          <h2>No official winner announced yet</h2>
          <p>Verified winners will appear here after the administrator reviews the competition results.</p>
        </div>
        <Button kind="secondary" onClick={() => go("leaderboard")}>
          View current leaderboard
        </Button>
      </main>
    </PublicShell>
  );
}

const nav: { label: string; screen: Screen; icon: IconName }[] = [
  { label: "Dashboard overview", screen: "dashboard", icon: "grid" },
  { label: "Competitions", screen: "competitions", icon: "trophy" },
  { label: "Question bank", screen: "questions", icon: "file" },
  { label: "Upload questions", screen: "upload", icon: "upload" },
  { label: "Participants", screen: "participants", icon: "users" },
  { label: "Live leaderboard", screen: "live", icon: "chart" },
  { label: "Winners", screen: "winners", icon: "trophy" },
  { label: "Reports & analytics", screen: "reports", icon: "chart" },
  { label: "Settings", screen: "settings", icon: "settings" },
];

function AdminShell({
  screen,
  children,
  title,
  subtitle,
  action,
}: {
  screen: Screen;
  children: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  const [mobile, setMobile] = useState(false);
  return (
    <div className="admin-shell">
      <aside className={mobile ? "show" : ""}>
        <div className="admin-brand">
          <Logo dark />
          <button onClick={() => setMobile(false)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="admin-account">
          <span>{(sessionStorage.getItem("adminEmail") || "Admin").slice(0, 2).toUpperCase()}</span>
          <div>
            <b>{sessionStorage.getItem("adminEmail") || "Administrator"}</b>
            <small>Admin account</small>
          </div>
        </div>
        <nav>
          {nav.map((n) => (
            <button
              className={n.screen === screen ? "active" : ""}
              onClick={() => {
                go(n.screen);
                setMobile(false);
              }}
              key={n.screen}
            >
              <Icon name={n.icon} />
              {n.label}
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={() => { sessionStorage.removeItem("adminToken"); sessionStorage.removeItem("adminEmail"); go("home"); }}>
          <Icon name="logout" />
          Log out
        </button>
        <div style={{ padding: "14px 20px 8px", fontSize: "11px", color: "var(--muted, #667085)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          Powered by <strong style={{ color: "var(--text, #98a2b3)" }}>LinvanX</strong>
        </div>
      </aside>
      <div className="admin-main">
        <header>
          <button className="mobile-menu" onClick={() => setMobile(true)}>
            <Icon name="menu" />
          </button>
          <span className="admin-connection"><i /> Supabase connected</span>
          <ThemeToggle />
          <button className="view-site" onClick={() => go("home")}>
            View public site <Icon name="arrow" />
          </button>
        </header>
        <main className="admin-content">
          <div className="admin-title">
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {action}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  change,
  icon,
  tone = "purple",
}: {
  label: string;
  value: string;
  change: string;
  icon: IconName;
  tone?: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon name={icon} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{change}</small>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({ competitions: 0, participants: 0, submissions: 0, perfectScores: 0, title: "Loading current quiz…", questionCount: 20 });
  const [recent, setRecent] = useState<Array<{ id: string; name: string; score: number; elapsedSeconds: number; submittedAt: string }>>([]);
  useEffect(() => {
    let active = true;
    const headers = { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` };
    const refresh = () => Promise.all([fetch("/api/competition/current").then((r) => r.json()), adminFetch("/api/admin/competitions", { headers }).then((r) => r.json()), adminFetch("/api/admin/live", { headers }).then((r) => r.json())])
      .then(([current, admin, activity]) => {
        if (!active) return;
        setStats({
        competitions: (admin.competitions || []).length,
        participants: current.participants || 0,
        submissions: current.submissions || 0,
        perfectScores: current.perfectScores || 0,
        title: current.competition?.title || "No published quiz",
        questionCount: current.competition?.questionCount || 20,
        });
        setRecent((activity.leaderboard || []).slice(0, 5));
      })
      .catch(() => {});
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return (
    <AdminShell
      screen="dashboard"
      title="Admin overview"
      subtitle="Here’s what’s happening across your competitions today."
      action={
        <Button icon="plus" onClick={() => go("create")}>
          New competition
        </Button>
      }
    >
      <div className="stats-grid">
        <Stat label="Total competitions" value={String(stats.competitions)} change="Saved in Supabase" icon="trophy" />
        <Stat
          label="Registered participants"
          value={String(stats.participants)}
          change="For the current published quiz"
          icon="users"
          tone="blue"
        />
        <Stat
          label="Completed submissions"
          value={String(stats.submissions)}
          change="Saved quiz submissions"
          icon="check"
          tone="green"
        />
        <Stat
          label="Perfect scores"
          value={String(stats.perfectScores)}
          change="Perfect scores recorded"
          icon="chart"
          tone="orange"
        />
      </div>
      <div className="dashboard-grid">
        <div className="surface live-card">
          <span className="status-live">CURRENT PUBLISHED QUIZ</span>
          <h2>{stats.title}</h2>
          <div className="live-score"><span><b>{stats.participants}</b>registered</span><span><b>{stats.submissions}</b>submitted</span></div>
          <div className="completion"><span>Completion</span><b>{stats.participants ? Math.round(stats.submissions / stats.participants * 100) : 0}%</b><i><em style={{ width: `${stats.participants ? Math.min(100, stats.submissions / stats.participants * 100) : 0}%` }} /></i></div>
          <Button kind="secondary" onClick={() => go("live")}>Open live monitor</Button>
        </div>
        <div className="surface chart-card">
          <div className="card-heading"><div><h2>Leading submissions</h2><p>Highest ranked results for the current quiz</p></div><button onClick={() => go("participants")}>View participants</button></div>
          {recent.map((entry) => <div className="recent-row" key={entry.id}><b>{entry.name}</b><span>{entry.score}/{stats.questionCount}</span><small>{new Date(entry.submittedAt).toLocaleString()}</small></div>)}
          {!recent.length && <div className="empty-state">Submissions will appear here after participants finish a quiz.</div>}
        </div>
      </div>
    </AdminShell>
  );
}

function Competitions() {
  const [items, setItems] = useState<PublicCompetition[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const load = () => adminFetch("/api/admin/competitions", { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setItems(data.competitions || []))
      .catch(() => { setItems([]); setError("Could not load competitions. Check your admin session and backend connection."); });
  useEffect(() => { void load(); }, []);
  const remove = async (item: PublicCompetition) => {
    if (!window.confirm(`Delete “${item.title}”? This also removes its registrations and quiz records.`)) return;
    setError("");
    try {
      const response = await adminFetch(`/api/admin/competitions/${item.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete competition.");
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete competition."); }
  };
  const visibleItems = items.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()) && (statusFilter === "all" || item.status.toLowerCase() === statusFilter));
  return (
    <AdminShell
      screen="competitions"
      title="Competitions"
      subtitle="Create, schedule and manage every quiz competition."
      action={
        <Button icon="plus" onClick={() => go("create")}>
          Create competition
        </Button>
      }
    >
      <div className="filterbar">
        <div>
          <Icon name="search" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search competitions..." />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Draft</option>
          <option value="completed">Completed</option>
        </select>
        <select>
          <option>Newest first</option>
        </select>
      </div>
      <div className="surface data-table admin-table">
        <div className="tr th">
          <span>COMPETITION</span>
          <span>STATUS</span>
          <span>ENTRY CODE</span>
          <span>PARTICIPANTS</span>
          <span>DATES</span>
          <span>VISIBILITY</span>
          <span />
        </div>
        {visibleItems.map((c) => (
          <div className="tr" key={c.id}>
            <span>
              <b>{c.title}</b>
              <small>{c.description || "Quiz competition"}</small>
            </span>
            <span>
              <i className={`pill ${c.isPublished ? "green" : "orange"}`}>{c.status}</i>
            </span>
            <span><b className="table-code">{c.entryCode || "—"}</b></span>
            <span>
              <b>{c.participantCount || 0} / {c.maxParticipants}</b>
            </span>
            <span className="competition-dates"><b>{c.startAt ? new Date(c.startAt).toLocaleString() : "Opens immediately"}</b><small>{c.endAt ? `Closes ${new Date(c.endAt).toLocaleString()}` : "No closing time"}</small><small><EventCountdown event={c} /></small></span>
            <span>{c.isPublished ? "Published" : "Unpublished"}</span>
            <span className="table-actions">
              <button onClick={() => { selectedCompetitionId = c.id; go("questions"); }} title="View and edit question bank for this quiz">Questions</button>
              <button onClick={() => { selectedCompetitionId = c.id; go("upload"); }} title="Bulk upload questions for this quiz">Upload</button>
              <button onClick={() => { selectedCompetitionId = c.id; go("edit"); }}>Edit</button>
              <button className="text-danger" onClick={() => void remove(c)}>Delete</button>
            </span>
          </div>
        ))}
        {error && <p className="form-error table-error">{error}</p>}
        {!visibleItems.length && <div className="empty-state">No competitions match these filters.</div>}
      </div>
    </AdminShell>
  );
}

function CreateCompetition({ editing = false }: { editing?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<PublicCompetition | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!editing) return;
    adminFetch("/api/admin/competitions", { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setExisting((data.competitions || []).find((item: PublicCompetition) => item.id === selectedCompetitionId) || null))
      .catch(() => setError("Could not load this competition for editing."));
  }, [editing]);
  return (
    <AdminShell
      screen={editing ? "edit" : "create"}
      title={editing ? "Edit competition" : "Create competition"}
      subtitle={editing ? "Update event details, entry window, quiz rules and visibility." : "Configure the experience, rules and reward."}
      action={
        <Button kind="ghost" onClick={() => go("competitions")}>
          Cancel
        </Button>
      }
    >
      <form
        key={existing?.id || "new-competition"}
        ref={formRef}
        className="create-layout"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const form = e.currentTarget;
          const values = new FormData(form);
          try {
            const response = await fetch(editing ? `/api/admin/competitions/${selectedCompetitionId}` : "/api/admin/competitions", {
              method: editing ? "PUT" : "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` },
              body: JSON.stringify({
                title: values.get("title"), description: values.get("description"),
                startAt: values.get("startAt") || null, endAt: values.get("endAt") || null,
                questionCount: Number(values.get("questionCount")), durationMinutes: Number(values.get("durationMinutes")),
                maxParticipants: Number(values.get("maxParticipants")), rules: values.get("rules"),
                prize: values.get("prize"), isPublished: values.get("isPublished") === "on",
              }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Could not create this quiz.");
            void fetchPublicHome(true).catch(() => {});
            setSaved(true);
            window.setTimeout(() => go("competitions"), 800);
          } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Could not reach the backend.");
          }
        }}
      >
        <div className="surface form-section">
          <div className="section-number">1</div>
          <div>
            <h2>Competition details</h2>
            <p>Give participants a clear, compelling overview.</p>
          </div>
          <label>
            Competition title *<input required name="title" minLength={3} defaultValue={existing?.title} placeholder="e.g. The Ultimate Knowledge Sprint" />
          </label>
          <label>
            Description
            <textarea name="description" rows={4} defaultValue={existing?.description} placeholder="What should participants expect?" />
          </label>
          <div className="two-col">
            <label>
              Start date & time
              <input name="startAt" type="datetime-local" defaultValue={existing?.startAt ? new Date(new Date(existing.startAt).getTime() - new Date(existing.startAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""} />
            </label>
            <label>
              End date & time
              <input name="endAt" type="datetime-local" defaultValue={existing?.endAt ? new Date(new Date(existing.endAt).getTime() - new Date(existing.endAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""} />
            </label>
          </div>
        </div>
        <div className="surface form-section">
          <div className="section-number">2</div>
          <div>
            <h2>Quiz configuration</h2>
            <p>Set the challenge level and participation limits.</p>
          </div>
          <div className="three-col">
            <label>
              Number of questions
              <input name="questionCount" type="number" min="1" max="50" required defaultValue={existing?.questionCount || 20} />
            </label>
            <label>
              Time limit (minutes)
              <input name="durationMinutes" type="number" min="1" max="180" required defaultValue={existing?.durationMinutes || 10} />
            </label>
            <label>
              Maximum participants
              <input name="maxParticipants" type="number" min="1" required defaultValue={existing?.maxParticipants || 1000} />
            </label>
          </div>
          <label>
            Competition rules
            <textarea
              name="rules"
              rows={4}
              defaultValue={existing?.rules ||
                "Answer each question in writing.\nHighest score wins; ties are broken by fastest completion time."
              }
            />
          </label>
        </div>
        <div className="surface form-section">
          <div className="section-number">3</div>
          <div>
            <h2>Prize & publishing</h2>
            <p>Describe the reward and choose its visibility.</p>
          </div>
          <label>
            Prize description
            <input name="prize" defaultValue={existing?.prize} placeholder="₵2,500 cash prize + Champion badge" />
          </label>
          <div className="toggle-row">
            <div>
              <b>Publish competition</b>
              <p>Make this competition visible on the public website.</p>
            </div>
            <label className="switch">
              <input name="isPublished" type="checkbox" defaultChecked={editing ? existing?.isPublished : true} />
              <span />
            </label>
          </div>
          <div className="form-submit">
            <Button kind="ghost" onClick={() => {
              const publish = formRef.current?.elements.namedItem("isPublished") as HTMLInputElement | null;
              if (publish) publish.checked = false;
              formRef.current?.requestSubmit();
            }}>Save as draft</Button>
            <Button type="submit" icon="check">
              {editing ? "Save changes" : "Create competition"}
            </Button>
          </div>
          {saved && (
            <div className="saved-toast">
              <Icon name="check" /> Quiz saved. Opening your competitions…
            </div>
          )}
          {error && <div className="saved-toast error-message">{error}</div>}
        </div>
      </form>
    </AdminShell>
  );
}

function Questions() {
  const [competitions, setCompetitions] = useState<PublicCompetition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState(() => selectedCompetitionId || "");
  const [rows, setRows] = useState<Array<{ id: string; question: string; acceptedAnswers: string[]; category: string; marks: number; explanation: string; status: string }>>([]);
  const [preview, setPreview] = useState<(typeof rows)[number] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadQuestions = (targetId?: string) => {
    const id = targetId || selectedCompId;
    if (!id) return Promise.resolve();
    return adminFetch(`/api/admin/questions?competitionId=${id}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setRows(data.questions || []))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    adminFetch("/api/admin/competitions", { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        const comps: PublicCompetition[] = data.competitions || [];
        setCompetitions(comps);
        const active = (selectedCompetitionId && comps.find((c) => c.id === selectedCompetitionId)) || comps.find((c) => c.status === "active") || comps[0];
        if (active) {
          setSelectedCompId(active.id);
          selectedCompetitionId = active.id;
          void loadQuestions(active.id);
        }
      })
      .catch(() => setError("Could not load competitions."));
  }, []);

  const handleCompetitionChange = (id: string) => {
    setSelectedCompId(id);
    selectedCompetitionId = id;
    void loadQuestions(id);
  };

  const categories = [...new Set(rows.map((row) => row.category))];
  const filteredRows = rows.filter((row) => row.question.toLowerCase().includes(search.toLowerCase()) && (categoryFilter === "all" || row.category === categoryFilter) && (statusFilter === "all" || row.status === statusFilter));
  const activeComp = competitions.find((c) => c.id === selectedCompId);

  return (
    <AdminShell
      screen="questions"
      title="Question bank"
      subtitle="Create law questions that require students to write a direct answer."
      action={
        <div className="button-row">
          <Button kind="ghost" icon="upload" onClick={() => { selectedCompetitionId = selectedCompId; go("upload"); }}>
            Bulk upload
          </Button>
          <Button icon="plus" onClick={() => setCreateOpen(true)} disabled={!selectedCompId}>
            Add question
          </Button>
        </div>
      }
    >
      <div className="surface" style={{ padding: "16px 20px", marginBottom: "20px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", border: "1px solid var(--border, #344054)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="trophy" /> Active Competition:
          </span>
          <select
            value={selectedCompId}
            onChange={(e) => handleCompetitionChange(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border, #344054)", background: "var(--surface, #1e293b)", color: "inherit", fontWeight: 600, fontSize: "14px", minWidth: "280px" }}
          >
            {!competitions.length && <option value="">Loading competitions...</option>}
            {competitions.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.title} ({comp.status}) — {comp.questionCount} questions configured
              </option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: "13px", color: "var(--muted, #94a3b8)" }}>
          <b>{rows.length}</b> / 50 questions saved for this quiz
        </div>
      </div>
      <div className="category-stats">
        <div>
            <b>{rows.length}</b>
          <span>Total questions</span>
        </div>
        <div>
            <b>{categories.length}</b>
          <span>Categories</span>
        </div>
        <div>
            <b>{rows.filter((row) => row.status === "published").length}</b>
          <span>Published</span>
        </div>
        <div>
            <b>{rows.filter((row) => row.status === "draft").length}</b>
          <span>Drafts</span>
        </div>
      </div>
      <div className="filterbar">
        <div>
          <Icon name="search" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions..." />
        </div>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>
      <div className="surface data-table questions-table">
        <div className="tr th">
          <span>QUESTION</span>
          <span>CATEGORY</span>
          <span>CORRECT ANSWER</span>
          <span>MARKS</span>
          <span>STATUS</span>
          <span />
        </div>
        {filteredRows.map((q) => (
          <div className="tr" key={q.id}>
            <span>
              <b>{q.question}</b>
            </span>
            <span>
              <i className="category">{q.category}</i>
            </span>
            <span>{q.acceptedAnswers?.join(" · ") || "Answer not set"}</span>
            <span>{q.marks} mark{q.marks === 1 ? "" : "s"}</span>
            <span>
              <i className={`pill ${q.status === "published" ? "green" : "orange"}`}>{q.status}</i>
            </span>
            <span className="row-actions">
              <button onClick={() => setPreview(q)} aria-label="Preview question">
                <Icon name="eye" />
              </button>
              <button aria-label="Delete question" onClick={async () => {
                if (!window.confirm("Delete this question?")) return;
                const response = await adminFetch(`/api/admin/questions/${q.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } });
                if (response.ok) void loadQuestions(); else setError("Could not delete this question.");
              }}>
                <Icon name="trash" />
              </button>
            </span>
          </div>
        ))}
        {!filteredRows.length && <div className="empty-state">No saved questions for {activeComp?.title || "this quiz"} yet.</div>}
      </div>
      {preview && (
        <div className="modal-backdrop">
          <div className="modal question-preview">
            <button className="modal-close" onClick={() => setPreview(null)}>
              <Icon name="close" />
            </button>
            <span className="eyebrow">QUESTION PREVIEW</span>
            <h2>{preview?.question}</h2>
            <div className="correct-option"><span>ACCEPTED ANSWERS</span>{preview?.acceptedAnswers?.join(" · ") || "No answer set"}<Icon name="check" /></div>
            {preview?.explanation && <p><b>Explanation:</b> {preview.explanation}</p>}
          </div>
        </div>
      )}
      {createOpen && (
        <div className="modal-backdrop">
          <form
            className="modal question-form"
            onSubmit={(event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              const acceptedAnswers = String(values.get("acceptedAnswers") || "").split(/[;\n]+/).map((answer) => answer.trim()).filter(Boolean);
              void adminFetch("/api/admin/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` },
                body: JSON.stringify({
                  competitionId: selectedCompId,
                  question: values.get("question"),
                  acceptedAnswers,
                  category: values.get("category"),
                  marks: values.get("marks"),
                  explanation: values.get("explanation"),
                  status: values.get("status")
                }),
              }).then(async (response) => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || "Could not save this question.");
                setCreateOpen(false);
                setCreated(true);
                void loadQuestions(selectedCompId);
              }).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Could not reach the backend."));
            }}
          >
            <button type="button" className="modal-close" onClick={() => setCreateOpen(false)}>
              <Icon name="close" />
            </button>
            <span className="eyebrow">NEW QUESTION</span>
            <h2>Add a question</h2>
            <p>
              Saving to quiz: <strong style={{ color: "var(--primary, #7c3aed)" }}>{activeComp?.title || "Selected competition"}</strong>
            </p>
            <label>
              Question text *
              <textarea required name="question" rows={3} placeholder="Enter the question participants will see" />
            </label>
            <label>
              Correct answer *
              <textarea required name="acceptedAnswers" rows={3} placeholder="e.g. Ratio decidendi" />
              <small>For equivalent answers, put one accepted version per line or separate them with semicolons.</small>
            </label>
            <div className="three-col">
              <label>
                Answer format
                <input readOnly value="Written response" />
              </label>
              <label>
                Category
                <select name="category">
                  <option>Law</option>
                  <option>Constitutional Law</option>
                  <option>Criminal Law</option>
                  <option>Contract Law</option>
                  <option>Tort Law</option>
                  <option>Evidence</option>
                  <option>Legal Principles</option>
                </select>
              </label>
              <label>
                Marks
                <input name="marks" type="number" min="1" defaultValue="1" />
              </label>
            </div>
            <label>
              Explanation <span>Optional</span>
              <textarea name="explanation" rows={2} placeholder="Explain why the selected answer is correct" />
            </label>
            <label>Status<select name="status" defaultValue="published"><option value="published">Published</option><option value="draft">Draft</option></select></label>
            <div className="modal-actions">
              <Button kind="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" icon="check">
                Save question
              </Button>
            </div>
          </form>
        </div>
      )}
      {created && (
        <button className="success-toast" onClick={() => setCreated(false)}>
          <Icon name="check" /> Question saved to this quiz
          <Icon name="close" />
        </button>
      )}
      {error && <button className="success-toast" onClick={() => setError("")}>{error}<Icon name="close" /></button>}
    </AdminShell>
  );
}

function parseQuestionCsv(source: string) {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"' && quoted && source[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (rows.length < 2) throw new Error("The CSV needs a header row and at least one question.");
  const headers = rows.shift()!.map((value) => value.trim().replace(/^\uFEFF/, "").toLowerCase());
  const required = ["question", "correct_answer"];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(", ")}`);
  return rows.map((values, index) => {
    const get = (key: string) => values[headers.indexOf(key)]?.trim() || "";
    const acceptedAnswers = [...get("correct_answer").split(/[;|]+/), ...get("accepted_answers").split(/[;|]+/)].map((answer) => answer.trim()).filter(Boolean);
    if (!get("question") || !acceptedAnswers.length) throw new Error(`Row ${index + 2} needs a question and at least one written correct answer.`);
    const marks = Number(get("marks") || 1);
    if (!Number.isFinite(marks) || marks <= 0) throw new Error(`Row ${index + 2} must have a positive number of marks.`);
    return { question: get("question"), acceptedAnswers, marks, category: get("category") || "Law", explanation: get("explanation") };
  });
}

function UploadQuestions() {
  const [file, setFile] = useState(false),
    [fileName, setFileName] = useState(""),
    [fileError, setFileError] = useState(""),
    [progress, setProgress] = useState(0),
    [importSummary, setImportSummary] = useState<{ imported: number; skippedDuplicates: number } | null>(null),
    [parsedQuestions, setParsedQuestions] = useState<ReturnType<typeof parseQuestionCsv>>([]),
    [competitions, setCompetitions] = useState<PublicCompetition[]>([]),
    [uploadTargetId, setUploadTargetId] = useState(() => selectedCompetitionId || ""),
    [uploading, setUploading] = useState(false);
  useEffect(() => {
    adminFetch("/api/admin/competitions", { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        const items: PublicCompetition[] = data.competitions || [];
        setCompetitions(items);
        const preferred = (selectedCompetitionId && items.find((item) => item.id === selectedCompetitionId)) || items.find((item) => item.status === "active") || items[0];
        if (preferred) {
          setUploadTargetId(preferred.id);
          selectedCompetitionId = preferred.id;
        }
      }).catch(() => setFileError("Could not load competitions. Sign in again and retry."));
  }, []);
  async function chooseFile(selected?: File) {
    if (!selected) return;
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (extension !== "csv") {
      setFile(false);
      setFileError("Choose a CSV file. Excel workbooks are not supported yet.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFile(false);
      setFileError("This file is larger than 10 MB. Choose a smaller spreadsheet.");
      return;
    }
    try {
      const parsed = parseQuestionCsv(await selected.text());
      setParsedQuestions(parsed);
      setFileError("");
      setFileName(selected.name);
      setFile(true);
    } catch (error) {
      setFile(false);
      setParsedQuestions([]);
      setFileError(error instanceof Error ? error.message : "Could not read this CSV.");
    }
  }
  async function upload() {
    setUploading(true);
    setFileError("");
    setImportSummary(null);
    try {
      const response = await adminFetch("/api/admin/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` },
        body: JSON.stringify({ competitionId: uploadTargetId, questions: parsedQuestions }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not import this CSV.");
      setImportSummary({ imported: Number(result.imported) || 0, skippedDuplicates: Number(result.skippedDuplicates) || 0 });
      setProgress(100);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Could not reach the backend.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <AdminShell
      screen="upload"
      title="Bulk upload questions"
      subtitle="Import law questions with direct written answers."
      action={<Button kind="ghost" icon="download" onClick={() => {
        const blob = new Blob(['question,correct_answer,accepted_answers,marks,category,explanation\n"What is the binding legal reason for a court decision called?",Ratio decidendi,"Ratio; Ratio decidendi",1,Legal Principles,'], { type: "text/csv" });
        const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "john-quiz-questions-template.csv"; link.click(); URL.revokeObjectURL(link.href);
      }}>Download sample CSV</Button>}
    >
      <div className="upload-layout">
        <div className="surface upload-card">
          <label className="upload-event-select">Target competition for this upload *
            <select
              value={uploadTargetId}
              onChange={(event) => {
                setUploadTargetId(event.target.value);
                selectedCompetitionId = event.target.value;
                setImportSummary(null);
                setProgress(0);
              }}
              required
            >
              {!competitions.length && <option value="">No competitions available</option>}
              {competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.title} · {competition.status}</option>)}
            </select>
          </label>
          <div style={{ padding: "10px 14px", background: "rgba(105, 65, 198, 0.08)", borderRadius: "8px", fontSize: "13px", color: "var(--text, inherit)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid rgba(105, 65, 198, 0.2)" }}>
            <Icon name="shield" />
            <span>
              Target Quiz: <strong>{competitions.find((c) => c.id === uploadTargetId)?.title || "Selected competition"}</strong>. Questions uploaded here belong strictly to this quiz and will not affect other competitions.
            </span>
          </div>
          <div className="upload-steps">
            <span className="active">
              <i>1</i>Upload
            </span>
            <em />
            <span className={progress === 100 ? "active" : ""}>
              <i>2</i>Validate
            </span>
            <em />
            <span className={progress === 100 ? "active" : ""}>
              <i>3</i>Publish
            </span>
          </div>
          {!file ? (
            <label className="dropzone">
              <input
                type="file"
                accept=".csv"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
              <span>
                <Icon name="upload" size={28} />
              </span>
              <h2>Choose a question CSV</h2>
              <p>or click to browse from your computer</p>
              <small>CSV · Maximum 10 MB</small>
            </label>
          ) : (
            <div className="file-selected">
              <div className="file-type">CSV</div>
              <div>
                <b>{fileName}</b>
              <span>{parsedQuestions.length} questions ready to import</span>
              </div>
              <button
                onClick={() => {
                  setFile(false);
                  setFileName("");
                  setFileError("");
                  setProgress(0);
                  setImportSummary(null);
                  setParsedQuestions([]);
                }}
              >
                <Icon name="trash" />
              </button>
              {progress > 0 && (
                <div className="upload-progress">
                  <i>
                    <em style={{ width: `${progress}%` }} />
                  </i>
                  <span>
                    {progress === 100
                      ? "Questions saved to the database"
                      : `Uploading... ${progress}%`}
                  </span>
                </div>
              )}
            </div>
          )}
          {fileError && (
            <div className="validation-error">
              <Icon name="close" />
              <div>
                <b>{file ? "Upload could not finish" : "File could not be selected"}</b>
                <p>{fileError}</p>
              </div>
            </div>
          )}
          <Button icon="upload" disabled={!file || progress > 0 || uploading} onClick={upload}>
            Upload and validate
          </Button>
          {progress === 100 && (
            <div className="validation-success">
              <Icon name="check" />
              <div>
                <b>{importSummary?.imported ?? parsedQuestions.length} questions imported</b>
                <p>{importSummary?.skippedDuplicates ? `${importSummary.skippedDuplicates} existing duplicate questions were skipped. ` : ""}They are saved to <strong>{competitions.find((item) => item.id === uploadTargetId)?.title || "the selected quiz"}</strong> and appear in its question bank.</p>
                <div style={{ marginTop: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Button onClick={() => { selectedCompetitionId = uploadTargetId; go("questions"); }}>
                    View in Question Bank
                  </Button>
                  <Button kind="ghost" onClick={() => { setFile(false); setFileName(""); setFileError(""); setProgress(0); setImportSummary(null); setParsedQuestions([]); }}>
                    Upload more questions
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="surface format-card">
          <h2>Required file format</h2>
          <p>Your spreadsheet must include these exact column headers.</p>
          {[
            "question",
            "correct_answer",
            "accepted_answers (optional)",
            "marks (optional)",
            "category (optional)",
            "explanation (optional)",
          ].map((x, i) => (
            <div key={x}>
              <span>{x}</span>
              {i < 2 && <b>Required</b>}
            </div>
          ))}
          <div className="tip">
            <Icon name="file" />
            <p>
              <b>Formatting tip</b>Write the answer itself. Separate equivalent accepted answers with semicolons.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function LiveMonitor() {
  const [live, setLive] = useState<{ competition: PublicCompetition; participants: number; submissions: number; pending: number; perfectScores: number; leaderboard: Array<{ id: string; name: string; score: number; elapsedSeconds: number; submittedAt: string }> } | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => adminFetch("/api/admin/live", { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (active) setLive(data); })
      .catch(() => {});
    void refresh();
    const timer = window.setInterval(refresh, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const top = live?.leaderboard[0];
  const formatDuration = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <AdminShell
      screen="live"
      title="Live competition monitor"
      subtitle={`${live?.competition?.title || "Current quiz"} · Refreshes every 10 seconds`}
      action={
        <span className="live-admin">
          <i /> {live?.competition?.status.toUpperCase() || "LOADING"}
        </span>
      }
    >
      <div className="stats-grid live-stats">
        <Stat label="Registered" value={String(live?.participants ?? 0)} change={`of ${live?.competition?.maxParticipants ?? 0} capacity`} icon="users" />
        <Stat label="Not submitted" value={String(live?.pending ?? 0)} change="Registered participants" icon="play" tone="blue" />
        <Stat
          label="Completed"
          value={String(live?.submissions ?? 0)}
          change="Recorded submissions"
          icon="check"
          tone="green"
        />
        <Stat
          label="Perfect scores"
          value={String(live?.perfectScores ?? 0)}
          change="Perfect scores"
          icon="trophy"
          tone="orange"
        />
      </div>
      <div className="monitor-grid">
        <div className="surface activity-card">
          <div className="card-heading">
            <div>
              <h2>Submission status</h2>
              <p>Counts from saved registration and submission records</p>
            </div>
            <span className="status-live">LIVE</span>
          </div>
          <div className="live-summary">
            <strong>{live?.submissions ?? 0}</strong><span>submissions received</span>
            <i><em style={{ width: `${live?.participants ? Math.min(100, (live.submissions / live.participants) * 100) : 0}%` }} /></i>
            <small>{live?.participants ? Math.round((live.submissions / live.participants) * 100) : 0}% of registered participants submitted</small>
          </div>
        </div>
        <div className="surface fastest-card">
          <span>TOP SUBMISSION</span>
          {top ? <><div className="winner-avatar">{top.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div><h2>{top.name}</h2><strong>{top.score}/{live?.competition?.questionCount}</strong><p>{formatDuration(top.elapsedSeconds)} · {new Date(top.submittedAt).toLocaleString()}</p></> : <p>No submissions recorded yet.</p>}
        </div>
      </div>
      <div className="surface data-table admin-table live-table">
        <div className="table-head">
          <div>
            <h2>Live leaderboard</h2>
            <p>Automatically ranked by score, time and timestamp</p>
          </div>
          <Button kind="ghost" icon="download" onClick={() => {
            const rows = live?.leaderboard || [];
            const csv = ["rank,name,score,duration,submitted_at", ...rows.map((row, index) => `${index + 1},"${row.name.replace(/"/g, '""')}",${row.score},${formatDuration(row.elapsedSeconds)},${row.submittedAt}`)].join("\n");
            const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "quiz-leaderboard.csv"; link.click(); URL.revokeObjectURL(link.href);
          }}>
            Export CSV
          </Button>
        </div>
        <div className="tr th">
          <span>RANK</span>
          <span>PARTICIPANT</span>
          <span>SCORE</span>
          <span>DURATION</span>
          <span>SUBMITTED</span>
          <span>STATUS</span>
        </div>
        {(live?.leaderboard || []).map((r, index) => (
          <div className="tr" key={r.id}>
            <span className="rank">#{index + 1}</span>
            <span>
              <b>{r.name}</b>
              <small>{r.id}</small>
            </span>
            <span>
              <b>{r.score}/{live?.competition?.questionCount}</b>
            </span>
            <span className="mono">{formatDuration(r.elapsedSeconds)}</span>
            <span>{new Date(r.submittedAt).toLocaleString()}</span>
            <span>
              <i className="pill green">Submitted</i>
            </span>
          </div>
        ))}
        {!live?.leaderboard?.length && <div className="empty-state">No one has submitted this quiz yet.</div>}
      </div>
    </AdminShell>
  );
}

function Participants() {
  const [records, setRecords] = useState<Array<{ id: string; name: string; username: string; phone: string; classLevel: string; competitionId: string; competitionTitle: string; registeredAt: string; submission: { score: number; elapsedSeconds: number; answers?: number[] } | null }>>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [competitionFilter, setCompetitionFilter] = useState("all");
  useEffect(() => {
    adminFetch("/api/admin/participants", { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } })
      .then((response) => response.json())
      .then((data) => setRecords(data.participants || []))
      .catch(() => setRecords([]));
  }, []);
  const visibleRecords = records.filter((record) => [record.name, record.username, record.phone, record.classLevel].some((value) => (value || "").toLowerCase().includes(search.toLowerCase())) && (statusFilter === "all" || (statusFilter === "completed" ? Boolean(record.submission) : !record.submission)) && (competitionFilter === "all" || record.competitionId === competitionFilter));
  const competitions = [...new Map(records.map((record) => [record.competitionId, record.competitionTitle])).entries()];
  return (
    <AdminShell
      screen="participants"
      title="Participants"
      subtitle="Manage registrations and review individual submission records."
      action={
        <Button kind="ghost" icon="download" onClick={() => {
          const csv = ["name,username,phone,class_level,competition,registered_at,score", ...visibleRecords.map((record) => `"${record.name.replace(/"/g, '""')}","${record.username}","${record.phone}","${record.classLevel}","${record.competitionTitle}",${record.registeredAt},${record.submission?.score ?? ""}`)].join("\n");
          const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "quiz-participants.csv"; link.click(); URL.revokeObjectURL(link.href);
        }}>Export CSV</Button>
      }
    >
      <div className="stats-grid compact">
        <Stat
          label="All participants"
          value={String(records.length)}
          change="Registered for this competition"
          icon="users"
        />
        <Stat
          label="Phone on file"
          value={String(records.filter((record) => record.phone).length)}
          change="Participant contact details"
          icon="check"
          tone="green"
        />
        <Stat
          label="Completed quiz"
          value={String(records.filter((record) => record.submission).length)}
          change="Submissions recorded"
          icon="file"
          tone="blue"
        />
      </div>
      <div className="filterbar">
        <div>
          <Icon name="search" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, username, phone or class..." />
        </div>
        <select value={competitionFilter} onChange={(event) => setCompetitionFilter(event.target.value)}>
          <option value="all">All competitions</option>
          {competitions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All submission states</option>
          <option value="completed">Completed</option>
          <option value="registered">Registered</option>
        </select>
      </div>
      <div className="surface data-table admin-table participants-table">
        <div className="tr th">
          <span>PARTICIPANT</span>
          <span>PHONE</span>
          <span>CLASS / LEVEL</span>
          <span>COMPETITION</span>
          <span>REGISTERED</span>
          <span>SCORE</span>
          <span>STATUS</span>
        </div>
        {visibleRecords.map((r) => (
          <div className="tr" key={r.id}>
            <span>
              <b>{r.name}</b>
              <small>@{r.username}</small>
            </span>
            <span>{r.phone || "—"}</span>
            <span>{r.classLevel || "—"}</span>
            <span>{r.competitionTitle}</span>
            <span>{new Date(r.registeredAt).toLocaleDateString()}</span>
            <span>
              <b>{r.submission ? `${r.submission.score}/${r.submission.answers?.length || 20}` : "—"}</b>
            </span>
            <span>
              <i className={`pill ${r.submission ? "green" : "orange"}`}>{r.submission ? "Completed" : "Registered"}</i>
            </span>
          </div>
        ))}
        {!visibleRecords.length && <div className="empty-state">No participants match these filters.</div>}
      </div>
    </AdminShell>
  );
}

function Winners() {
  const [live, setLive] = useState<{ competition: PublicCompetition; participants: number; submissions: number; leaderboard: Array<{ id: string; name: string; score: number; elapsedSeconds: number; submittedAt: string }> } | null>(null);
  const [winners, setWinners] = useState<Array<{ id: string; name: string; score: number; declaredAt: string; submission_id?: string; submissionId?: string }>>([]);
  const [error, setError] = useState("");
  const reload = () => Promise.all([
    adminFetch("/api/admin/live", { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } }).then((r) => r.ok ? r.json() : Promise.reject()),
    adminFetch("/api/admin/winners", { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } }).then((r) => r.ok ? r.json() : Promise.reject()),
  ]).then(([activity, declared]) => { setLive(activity); setWinners(declared.winners || []); });
  useEffect(() => { void reload().catch(() => setError("Could not load winner records.")); }, []);
  const declare = async (submissionId: string) => {
    try {
      const response = await adminFetch("/api/admin/winners", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` }, body: JSON.stringify({ submissionId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not declare this winner.");
      await reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not declare this winner."); }
  };
  const declaredIds = new Set(winners.map((winner) => winner.submission_id || winner.submissionId || winner.id));
  return (
    <AdminShell
      screen="winners"
      title="Winner management"
      subtitle="Review ranking evidence and officially declare competition winners."
      action={
        <Button kind="ghost" icon="download" onClick={() => {
          const csv = ["name,score,declared_at", ...winners.map((winner) => `"${winner.name.replace(/"/g, '""')}",${winner.score},${winner.declaredAt}`)].join("\n");
          const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "quiz-winners.csv"; link.click(); URL.revokeObjectURL(link.href);
        }}>
          Export winners
        </Button>
      }
    >
      <div className="verification-banner">
        <Icon name="shield" size={26} />
        <div>
          <b>Winner declarations are saved to Supabase</b>
          <p>
            Select a recorded submission below. The declared winner remains visible in this panel.
          </p>
        </div>
      </div>
      <div className="winner-admin-grid">
        <div className="surface candidate-card">
          <div className="card-heading"><div><h2>Eligible submissions</h2><p>{live?.competition?.title || "Current quiz"}</p></div></div>
          {(live?.leaderboard || []).map((candidate, index) => (
            <div className="winner-candidate-row" key={candidate.id}>
              <span>#{index + 1}</span><div><b>{candidate.name}</b><small>{candidate.score}/{live?.competition?.questionCount} · {new Date(candidate.submittedAt).toLocaleString()}</small></div>
              {declaredIds.has(candidate.id) ? <i className="pill green">Declared</i> : <Button kind="secondary" icon="trophy" onClick={() => void declare(candidate.id)}>Declare winner</Button>}
            </div>
          ))}
          {!live?.leaderboard?.length && <div className="empty-state">No submissions are available to declare as a winner yet.</div>}
        </div>
        <div className="surface audit-card">
          <h2>Competition record</h2>
          <div>
            <span>Competition</span>
            <b>{live?.competition?.title || "Current quiz"}</b>
          </div>
          <div>
            <span>Competition ID</span>
            <b>{live?.competition?.id || "—"}</b>
          </div>
          <div>
            <span>Total participants</span>
            <b>{live?.participants || 0}</b>
          </div>
          <div>
            <span>Valid submissions</span>
            <b>{live?.submissions || 0}</b>
          </div>
          <div>
            <span>Perfect scores</span>
            <b>{live?.leaderboard?.filter((row) => row.score === live?.competition?.questionCount).length || 0}</b>
          </div>
          <div>
            <span>Tie-break rule</span>
            <b>Highest score, then shortest completion time</b>
          </div>
          <Button kind="ghost" onClick={() => go("leaderboard")}>
            Preview public announcement
          </Button>
        </div>
      </div>
      <div className="surface audit-card declared-winners">
        <h2>Declared winners</h2>
        {winners.map((winner) => <div key={winner.id}><b>{winner.name}</b><span>{winner.score} points · {winner.declaredAt ? new Date(winner.declaredAt).toLocaleString() : "Declared"}</span></div>)}
        {!winners.length && <div className="empty-state">No winners have been declared yet.</div>}
      </div>
      {error && <div className="validation-error"><Icon name="close" /><p>{error}</p></div>}
    </AdminShell>
  );
}

function Reports() {
  const [report, setReport] = useState<{ participants: number; submissions: number; averageScore: number; averageSeconds: number; accuracy: number; perfectScores: number; competitionCount: number; competitions: Array<{ id: string; title: string; participants: number; submissions: number; averageScore: number; averagePercent: number }>; activity?: Array<{ date: string; participants: number; submissions: number }>; missedQuestions: Array<{ question: string; missed: number; rate: number }> } | null>(null);
  useEffect(() => {
    adminFetch("/api/admin/reports", { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setReport)
      .catch(() => setReport(null));
  }, []);
  const duration = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
  const activity = report?.activity || [];
  const observed = activity.map((day) => day.submissions);
  const meanX = (observed.length - 1) / 2;
  const meanY = observed.reduce((sum, value) => sum + value, 0) / Math.max(1, observed.length);
  const slope = observed.length > 1 ? observed.reduce((sum, value, index) => sum + (index - meanX) * (value - meanY), 0) / observed.reduce((sum, _value, index) => sum + (index - meanX) ** 2, 0) : 0;
  const forecast = Array.from({ length: 7 }, (_, index) => Math.max(0, Math.round(meanY + slope * (observed.length + index - 1 - meanX))));
  const chartValues = [...observed, ...forecast];
  const chartMax = Math.max(1, ...chartValues);
  const chartPoint = (value: number, index: number) => `${(index / Math.max(1, chartValues.length - 1)) * 680},${190 - (value / chartMax) * 160}`;
  const actualPoints = observed.map(chartPoint).join(" ");
  const forecastPoints = observed.length ? [chartPoint(observed[observed.length - 1], observed.length - 1), ...forecast.map((value, index) => chartPoint(value, observed.length + index))].join(" ") : "";
  return (
    <AdminShell
      screen="reports"
      title="Reports & analytics"
      subtitle="Understand performance, quality and participation trends."
      action={<Button icon="download" onClick={() => {
        const rows = report?.competitions || [];
        const csv = ["competition,participants,submissions,average_score", ...rows.map((row) => `"${row.title.replace(/"/g, '""')}",${row.participants},${row.submissions},${row.averageScore.toFixed(2)}`)].join("\n");
        const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "john-quiz-report.csv"; link.click(); URL.revokeObjectURL(link.href);
      }}>Download CSV</Button>}
    >
      <div className="filterbar report-filter">
        <span>All saved competition and submission records</span>
      </div>
      <div className="stats-grid">
        <Stat label="Average score" value={`${(report?.averageScore || 0).toFixed(1)} pts`} change={`${report?.submissions || 0} recorded submissions`} icon="chart" />
        <Stat
          label="Average duration"
          value={duration(report?.averageSeconds || 0)}
          change="Average submitted duration"
          icon="clock"
          tone="blue"
        />
        <Stat
          label="Answer accuracy"
          value={`${(report?.accuracy || 0).toFixed(1)}%`}
          change="Correct answers across submissions"
          icon="check"
          tone="green"
        />
        <Stat
          label="Participation growth"
          value={String(report?.participants || 0)}
          change="Registered participants"
          icon="users"
          tone="orange"
        />
      </div>
      <div className="surface projection-card">
        <div className="card-heading">
          <div><h2>Submission activity</h2><p>Daily completed quizzes · last 14 days with a 7-day projection</p></div>
          <span className="projection-legend"><i /> Actual <i className="forecast-key" /> Projection</span>
        </div>
        {activity.length ? <div className="projection-chart-wrap">
          <svg className="projection-chart" viewBox="0 0 680 220" role="img" aria-label="Daily submissions and seven day projection">
            {[0, 1, 2, 3].map((line) => <g key={line}><line x1="0" x2="680" y1={30 + line * 50} y2={30 + line * 50} /><text x="0" y={25 + line * 50}>{Math.round(chartMax * (1 - line / 3))}</text></g>)}
            <polyline className="actual-line" points={actualPoints} />
            <polyline className="forecast-line" points={forecastPoints} />
            {observed.map((value, index) => <circle key={index} cx={chartPoint(value, index).split(",")[0]} cy={chartPoint(value, index).split(",")[1]} r="3.5" />)}
          </svg>
          <div className="projection-caption"><span>{activity[0]?.date}</span><b>Forecast: {forecast.reduce((sum, value) => sum + value, 0)} submissions next 7 days</b><span>+7 days</span></div>
        </div> : <div className="empty-state">The activity projection will appear when analytics has a 14-day history.</div>}
      </div>
      <div className="reports-grid">
        <div className="surface performance-chart">
          <div className="card-heading">
            <div>
              <h2>Competition performance</h2>
              <p>Average scores by competition</p>
            </div>
          </div>
          {(report?.competitions || []).map((r) => (
            <div className="hbar" key={r.id}>
              <span>{r.title}</span>
              <i>
                <em style={{ width: `${Math.min(100, (r.averagePercent || 0))}%` }} />
              </i>
              <b>{r.averageScore.toFixed(1)} pts</b>
            </div>
          ))}
          {!report?.competitions.length && <div className="empty-state">Competition reports appear once quizzes are published.</div>}
        </div>
        <div className="surface missed-card">
          <div className="card-heading">
            <div>
              <h2>Most missed questions</h2>
              <p>Opportunities to improve question clarity</p>
            </div>
          </div>
          {(report?.missedQuestions || []).map((question, i) => (
            <div key={`${question.question}-${i}`}>
              <span>{i + 1}</span>
              <p>
                <b>{question.question}</b>
                <small>{question.missed} incorrect responses</small>
              </p>
              <strong>{question.rate}% missed</strong>
            </div>
          ))}
          {!report?.missedQuestions.length && <div className="empty-state">No answer statistics yet.</div>}
        </div>
      </div>
    </AdminShell>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState({ platformName: "John quiz.com", supportEmail: "hello@johnquiz.com", timezone: "Africa/Accra", dateFormat: "DD/MM/YYYY" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    adminFetch("/api/admin/settings", { headers: { Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setSettings(data.settings))
      .catch(() => setError("Could not load saved settings. Confirm the backend is connected and run the platform settings migration in Supabase."));
  }, []);
  const update = (key: keyof typeof settings, value: string) => { setSaved(false); setSettings((old) => ({ ...old, [key]: value })); };
  return (
    <AdminShell
      screen="settings"
      title="Settings"
      subtitle="Update the organization details shown across the public site."
    >
      <div className="settings-layout">
        <form className="surface settings-form" onSubmit={(event) => {
          event.preventDefault();
          setSaving(true);
          setSaved(false);
          void adminFetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionStorage.getItem("adminToken") || ""}` }, body: JSON.stringify(settings) })
            .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not save settings."); setSettings(data.settings); setSaved(true); setError(""); })
            .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not reach the backend."))
            .finally(() => setSaving(false));
        }}>
          <div className="settings-title"><span className="settings-title-icon"><Icon name="settings" /></span><div><h2>Platform preferences</h2><p>Manage the public identity and regional defaults for your quiz site.</p></div></div>
          <section className="settings-section">
            <div className="settings-section-heading"><span>01</span><div><h3>Brand and support</h3><p>Shown to participants across the public site.</p></div></div>
            <label>Platform name<input value={settings.platformName} onChange={(event) => update("platformName", event.target.value)} required /></label>
            <label>Support email<input type="email" value={settings.supportEmail} onChange={(event) => update("supportEmail", event.target.value)} required /></label>
          </section>
          <section className="settings-section">
            <div className="settings-section-heading"><span>02</span><div><h3>Regional defaults</h3><p>Used for dates and times throughout admin tools.</p></div></div>
            <div className="two-col">
              <label>Default timezone<select value={settings.timezone} onChange={(event) => update("timezone", event.target.value)}><option value="Africa/Accra">Africa/Accra</option><option value="UTC">UTC</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option></select></label>
              <label>Date format<select value={settings.dateFormat} onChange={(event) => update("dateFormat", event.target.value)}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></label>
            </div>
          </section>
          {error && <p className="form-error">{error}</p>}
          {saved && <p className="form-success">Settings saved.</p>}
          <div className="settings-save-row"><small>Changes are stored for this platform.</small><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></div>
        </form>
        <aside className="surface settings-aside">
          <span className="settings-aside-label">PUBLIC SITE PREVIEW</span>
          <div className="settings-preview-logo"><span><Icon name="trophy" /></span><b>{settings.platformName}</b></div>
          <p>Participants will see this brand and use the support contact if they need help.</p>
          <div className="settings-preview-row"><span>Support</span><b>{settings.supportEmail}</b></div>
          <div className="settings-preview-row"><span>Timezone</span><b>{settings.timezone}</b></div>
          <div className="settings-preview-row"><span>Date format</span><b>{settings.dateFormat}</b></div>
          <div className="settings-tip"><Icon name="check" /><span>Changes apply to the public header and footer after saving.</span></div>
        </aside>
      </div>
    </AdminShell>
  );
}

function Login() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="login-page">
      <div className="login-brand">
        <Logo dark />
        <div>
          <span className="eyebrow light">ADMINISTRATION</span>
          <h1>
            Fair competitions
            <br />
            start with trusted
            <br />
            <em>control.</em>
          </h1>
          <p>Manage every challenge, participant and result from one secure workspace.</p>
        </div>
        <small>
          <Icon name="shield" /> Enterprise-grade security & audit trails
        </small>
      </div>
      <div className="login-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={() => go("home")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted, #64748b)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              padding: "0.25rem 0",
              fontWeight: 500
            }}
          >
            ← Back to website
          </button>
          <ThemeToggle />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            const form = e.currentTarget;
            const email = (form.elements.namedItem("email") as HTMLInputElement).value;
            const password = (form.elements.namedItem("password") as HTMLInputElement).value;
            fetch("/api/admin/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            }).then(async (response) => {
              const result = await response.json().catch(() => ({}));
              if (!response.ok) throw new Error(result.error || "Sign in failed.");
              sessionStorage.setItem("adminToken", result.token);
              sessionStorage.setItem("adminEmail", result.admin?.email || email);
              go("dashboard");
            }).catch((err: Error) => {
              const msg = err.message || "Could not reach the backend server.";
              setError(msg);
              window.alert(msg);
            }).finally(() => {
              setLoading(false);
            });
          }}
        >
          <span className="mobile-login-logo">
            <Logo />
          </span>
          <h1>Welcome back</h1>
          <p>Sign in to your administrator workspace.</p>
          {error && (
            <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "0.75rem 1rem", borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}
          <label>
            Email address
            <input required name="email" type="email" placeholder="admin@johnquiz.com" defaultValue="admin@johnquiz.com" />
          </label>
          <label>
            Password
            <div className="password-field">
              <input required name="password" type={show ? "text" : "password"} placeholder="Enter admin password" />
              <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password visibility">
                <Icon name="eye" />
              </button>
            </div>
          </label>
          <Button type="submit" icon="arrow" disabled={loading}>
            {loading ? "Signing in..." : "Sign in securely"}
          </Button>
          <small>
            <Icon name="shield" /> Protected by secure authentication · Powered by LinvanX
          </small>
        </form>
      </div>
    </div>
  );
}

function isAdminRoute() {
  const path = window.location.pathname.toLowerCase();
  return path === "/admin" || path.startsWith("/admin/") || path === "/login";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => isAdminRoute() ? (sessionStorage.getItem("adminToken") ? "dashboard" : "login") : "home");
  const [theme, setTheme] = useState<"light" | "dark">(() => localStorage.getItem("johnquiz-theme") === "dark" ? "dark" : "light");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("johnquiz-theme", theme);
  }, [theme]);
  globalGo = (next) => {
    const adminScreens: Screen[] = ["login", "dashboard", "competitions", "create", "edit", "questions", "upload", "live", "participants", "winners", "reports", "settings"];
    if (adminScreens.includes(next) && next !== "login" && !sessionStorage.getItem("adminToken")) next = "login";
    if (adminScreens.includes(next) && !window.location.pathname.startsWith("/admin")) {
      window.history.pushState({}, "", "/admin");
    } else if (next === "home" && window.location.pathname.startsWith("/admin")) {
      sessionStorage.removeItem("adminToken");
      window.history.pushState({}, "", "/");
    }
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    const handlePopState = () => setScreen(isAdminRoute() ? (sessionStorage.getItem("adminToken") ? "dashboard" : "login") : "home");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const views: Record<Screen, React.ReactNode> = {
    home: <Home />,
    register: <Registration />,
    instructions: <Instructions />,
    quiz: <Quiz />,
    submitted: <Submitted />,
    leaderboard: <Leaderboard />,
    winner: <WinnerPage />,
    login: <Login />,
    dashboard: <Dashboard />,
    competitions: <Competitions />,
    create: <CreateCompetition />,
    edit: <CreateCompetition editing />,
    questions: <Questions />,
    upload: <UploadQuestions />,
    live: <LiveMonitor />,
    participants: <Participants />,
    winners: <Winners />,
    reports: <Reports />,
    settings: <SettingsPage />,
  };
  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((value) => value === "dark" ? "light" : "dark") }}>{views[screen]}</ThemeContext.Provider>;
}
