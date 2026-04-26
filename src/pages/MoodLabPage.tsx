import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "../styles/mood-lab.css";

interface MoodTag {
  id: string;
  name: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface MoodEntry {
  id: string;
  note?: string;
  tags?: MoodTag[];
  createdAt?: string;
  updatedAt?: string;
}

interface Post {
  id: string;
  title?: string;
  content?: string;
  created_at?: string;
  auth0_user_id?: string;
}

interface ScheduledEvent {
  id?: string;
  name: string;
  description?: string;
  schedule: string;
  created_at?: string;
  payload?: Record<string, string>;
}

interface MoodOverview {
  frequency?: Array<{ tag: string; count: number }>;
  totalEntries?: number;
  totalTagsApplied?: number;
}

interface MoodInsights {
  cooccurrence?: {
    nodes?: Array<{ id: string; count: number }>;
    edges?: Array<{ source: string; target: string; weight: number }>;
  };
  transitions?: Array<{ from: string; to: string; count: number }>;
}

interface MoodPatterns {
  calendar?: Array<{ date: string; entryCount: number; sentiment?: string }>;
  timeOfDay?: Array<{ hour: number; tag: string; count: number }>;
}

type LabStatus = "idle" | "loading" | "ready" | "error";

const API_ENDPOINTS = [
  { method: "GET", path: "/healthcheck", group: "vitals", use: "service version and lab pulse" },
  { method: "GET", path: "/me", group: "identity", use: "session, role, experiment owner" },
  { method: "GET", path: "/login", group: "identity", use: "Auth0 entry point" },
  { method: "GET", path: "/callback", group: "identity", use: "Auth0 return handler" },
  { method: "POST", path: "/refresh", group: "identity", use: "quietly renews the session" },
  { method: "GET", path: "/logout", group: "identity", use: "clears the observatory" },
  { method: "GET", path: "/posts", group: "field notes", use: "public text samples" },
  { method: "POST", path: "/posts", group: "field notes", use: "new observation notes" },
  { method: "GET", path: "/posts/{id}", group: "field notes", use: "single sample inspection" },
  { method: "PUT", path: "/posts/{id}", group: "field notes", use: "revise a sample" },
  { method: "DELETE", path: "/posts/{id}", group: "field notes", use: "remove noisy sample" },
  { method: "GET", path: "/mood-tags", group: "moods", use: "tag vocabulary" },
  { method: "POST", path: "/mood-tags", group: "moods", use: "documented only; lab stays read-only" },
  { method: "GET", path: "/mood-entries", group: "moods", use: "raw mood observations" },
  { method: "POST", path: "/mood-entries", group: "moods", use: "documented only; lab stays read-only" },
  { method: "GET", path: "/mood-entries/{id}", group: "moods", use: "hydrate one observation" },
  { method: "PUT", path: "/mood-entries/{id}", group: "moods", use: "documented only; lab stays read-only" },
  { method: "GET", path: "/moods/analytics/overview", group: "analytics", use: "frequency totals" },
  { method: "GET", path: "/moods/analytics/insights", group: "analytics", use: "co-occurrence and transitions" },
  { method: "GET", path: "/moods/analytics/patterns", group: "analytics", use: "time and calendar patterns" },
  { method: "GET", path: "/events", group: "automation", use: "scheduled experiments" },
  { method: "POST", path: "/events", group: "automation", use: "create recurring prompts" },
  { method: "POST", path: "/email", group: "signals", use: "send royal field memos" },
  { method: "GET", path: "/discord-ping", group: "signals", use: "test notification channel" },
  { method: "GET", path: "/admin/users", group: "admin", use: "role inventory" },
  { method: "POST", path: "/admin/users", group: "admin", use: "provision user" },
  { method: "PATCH", path: "/admin/users/{id}/role", group: "admin", use: "role mutation" },
  { method: "DELETE", path: "/admin/users/{id}", group: "admin", use: "deprovision user" },
];

const endpointTone: Record<string, string> = {
  vitals: "#6df0c2",
  identity: "#7bb2ff",
  "field notes": "#ffd166",
  moods: "#ff7a7a",
  analytics: "#c7f464",
  automation: "#b69cff",
  signals: "#f7a9ff",
  admin: "#d2d8ee",
};

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const getDefaultStart = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return toInputDate(date);
};

const getDefaultEnd = () => toInputDate(new Date());

const getTagNames = (entry: MoodEntry) =>
  (entry.tags || []).map((tag) => tag.name).filter(Boolean);

const getEntrySignal = (entry: MoodEntry) => {
  const names = getTagNames(entry);
  if (names.length > 0) {
    return names.join(" + ");
  }
  return entry.note || "untagged observation";
};

const getTimeValue = (value?: string) => {
  if (!value) {
    return Number.NaN;
  }
  return new Date(value).getTime();
};

const formatHour = (hour: number) => {
  const normalized = ((hour % 24) + 24) % 24;
  const suffix = normalized >= 12 ? "PM" : "AM";
  const display = normalized % 12 || 12;
  return `${display} ${suffix}`;
};

const decreePresets = [
  {
    label: "Royal Decree",
    subject: "By imperial decree: inspect the signal",
    body: "Esteemed citizen,\n\nThe palace has observed a suspiciously interesting signal in the NoFeed observatory. Kindly inspect it with the appropriate level of drama.\n\nSigned,\nThe Department of Very Important Vibes",
  },
  {
    label: "Trapdoor Memo",
    subject: "A tiny lever has been considered",
    body: "Official memo:\n\nA lever was noticed. Nobody is saying what it does. Still, the current signal deserves review before anyone touches anything ornate.\n\nCarry on with unreasonable confidence.",
  },
  {
    label: "Llama-Level Urgent",
    subject: "Urgent, but make it stylish",
    body: "Attention:\n\nThe mood lab has produced a reading with excellent cheekbones. Please review the attached context, nod once, and pretend this was your idea all along.",
  },
];

const MoodLabPage: React.FC = () => {
  const [status, setStatus] = useState<LabStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [healthVersion, setHealthVersion] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Record<string, any> | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [tags, setTags] = useState<MoodTag[]>([]);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [overview, setOverview] = useState<MoodOverview | null>(null);
  const [insights, setInsights] = useState<MoodInsights | null>(null);
  const [patterns, setPatterns] = useState<MoodPatterns | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [start, setStart] = useState(getDefaultStart);
  const [end, setEnd] = useState(getDefaultEnd);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
  );
  const [automationStatus, setAutomationStatus] = useState<string | null>(null);
  const [discordStatus, setDiscordStatus] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState(decreePresets[0].subject);
  const [emailText, setEmailText] = useState(decreePresets[0].body);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const analyticsParams = useMemo(
    () => ({
      start,
      end,
      timezone,
    }),
    [start, end, timezone]
  );

  const topTag = overview?.frequency?.[0];
  const activeTag = selectedTag || topTag?.tag || tags[0]?.name || null;
  const totalSignals = (overview?.totalEntries || 0) + posts.length + events.length;
  const constellation = useMemo(() => {
    const rawNodes = insights?.cooccurrence?.nodes || [];
    const frequency = overview?.frequency || [];
    const fallbackNodes = frequency.map((item) => ({ id: item.tag, count: item.count }));
    const nodes = (rawNodes.length > 0 ? rawNodes : fallbackNodes).slice(0, 12);
    const maxCount = Math.max(1, ...nodes.map((node) => node.count || 0));
    const radius = 42;

    return nodes.map((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(1, nodes.length) - Math.PI / 2;
      const pull = 0.72 + ((node.count || 0) / maxCount) * 0.28;
      return {
        ...node,
        x: 50 + Math.cos(angle) * radius * pull,
        y: 50 + Math.sin(angle) * radius * pull,
        size: 16 + ((node.count || 0) / maxCount) * 28,
      };
    });
  }, [insights, overview]);
  const activeNode = constellation.find((node) => node.id === activeTag) || constellation[0];
  const relatedEdges = useMemo(() => {
    return (insights?.cooccurrence?.edges || []).filter(
      (edge) => edge.source === activeTag || edge.target === activeTag
    );
  }, [activeTag, insights]);
  const matchingEntries = useMemo(() => {
    if (!activeTag) {
      return entries;
    }
    return entries.filter((entry) => getTagNames(entry).includes(activeTag));
  }, [activeTag, entries]);
  const activeEntry = useMemo(() => {
    return (
      entries.find((entry) => entry.id === selectedEntryId) ||
      matchingEntries[0] ||
      entries[0] ||
      null
    );
  }, [entries, matchingEntries, selectedEntryId]);
  const nearbyPosts = useMemo(() => {
    if (!activeEntry) {
      return posts.slice(0, 3);
    }
    const entryTime = getTimeValue(activeEntry.createdAt);
    if (Number.isNaN(entryTime)) {
      return posts.slice(0, 3);
    }
    return [...posts]
      .filter((post) => !Number.isNaN(getTimeValue(post.created_at)))
      .sort((a, b) => Math.abs(getTimeValue(a.created_at) - entryTime) - Math.abs(getTimeValue(b.created_at) - entryTime))
      .slice(0, 3);
  }, [activeEntry, posts]);
  const dominantHours = useMemo(() => {
    const points = patterns?.timeOfDay || [];
    const scoped = activeTag ? points.filter((point) => point.tag === activeTag) : points;
    return [...scoped].sort((a, b) => b.count - a.count).slice(0, 3);
  }, [activeTag, patterns]);
  const endpointsByGroup = useMemo(() => {
    return API_ENDPOINTS.reduce<Record<string, typeof API_ENDPOINTS>>((acc, endpoint) => {
      acc[endpoint.group] = acc[endpoint.group] || [];
      acc[endpoint.group].push(endpoint);
      return acc;
    }, {});
  }, []);

  const loadLab = async () => {
    setStatus("loading");
    setError(null);

    const [
      healthResult,
      meResult,
      postsResult,
      eventsResult,
      tagsResult,
      entriesResult,
      overviewResult,
      insightsResult,
      patternsResult,
    ] = await Promise.allSettled([
      api.get("/healthcheck"),
      api.get("/me"),
      api.get<Post[]>("/posts"),
      api.get<ScheduledEvent[]>("/events"),
      api.get<MoodTag[]>("/mood-tags"),
      api.get<MoodEntry[]>("/mood-entries", { params: { limit: 24, from: start, to: end } }),
      api.get<MoodOverview>("/moods/analytics/overview", { params: analyticsParams }),
      api.get<MoodInsights>("/moods/analytics/insights", { params: analyticsParams }),
      api.get<MoodPatterns>("/moods/analytics/patterns", { params: analyticsParams }),
    ]);

    if (healthResult.status === "fulfilled") {
      setHealthVersion(healthResult.value.data?.version || null);
    }
    if (meResult.status === "fulfilled") {
      setCurrentUser(meResult.value.data || null);
    }
    if (postsResult.status === "fulfilled") {
      setPosts(Array.isArray(postsResult.value.data) ? postsResult.value.data : []);
    }
    if (eventsResult.status === "fulfilled") {
      setEvents(Array.isArray(eventsResult.value.data) ? eventsResult.value.data : []);
    }
    if (tagsResult.status === "fulfilled") {
      const nextTags = Array.isArray(tagsResult.value.data) ? tagsResult.value.data : [];
      setTags(nextTags);
    }
    if (entriesResult.status === "fulfilled") {
      setEntries(Array.isArray(entriesResult.value.data) ? entriesResult.value.data : []);
    }
    if (overviewResult.status === "fulfilled") {
      setOverview(overviewResult.value.data || null);
    }
    if (insightsResult.status === "fulfilled") {
      setInsights(insightsResult.value.data || null);
    }
    if (patternsResult.status === "fulfilled") {
      setPatterns(patternsResult.value.data || null);
    }

    const failures = [
      tagsResult,
      entriesResult,
      overviewResult,
      insightsResult,
      patternsResult,
    ].filter((result) => result.status === "rejected");

    if (failures.length > 0) {
      setError("Some mood science endpoints did not answer yet. The lab is showing every signal it could collect.");
    }
    setStatus("ready");
  };

  useEffect(() => {
    loadLab();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsParams]);

  const createRhythmEvent = async () => {
    const variable = activeTag || "mood-check";
    setAutomationStatus("creating");
    setError(null);
    try {
      await api.post("/events", {
        name: `nofeed-${variable.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-lab`,
        description: `Daily NoFeed mood observation for ${variable}`,
        schedule: "0 14 * * ? *",
        payload: {
          experiment: "mood-lab",
          variable,
          source: "nofeed-ui",
        },
      });
      setAutomationStatus(`Daily ${variable} observation scheduled at 14:00 UTC.`);
      await loadLab();
    } catch (err: any) {
      setAutomationStatus(null);
      setError(err.response?.data?.error || "Could not create the scheduled experiment.");
    }
  };

  const pingDiscord = async () => {
    setDiscordStatus("pinging");
    setError(null);
    try {
      const res = await api.get("/discord-ping");
      setDiscordStatus(res.data?.message || res.data?.discord_status || "Discord signal sent.");
    } catch (err: any) {
      setDiscordStatus(err.response?.data?.error || "Discord ping failed.");
    }
  };

  const applyDecreePreset = (preset: typeof decreePresets[number]) => {
    const signalLine = activeTag ? `\n\nCurrent palace-approved signal: ${activeTag}.` : "";
    setEmailSubject(preset.subject);
    setEmailText(`${preset.body}${signalLine}`);
  };

  const sendRoyalEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipients = emailTo
      .split(",")
      .map((recipient) => recipient.trim())
      .filter(Boolean);

    if (recipients.length === 0 || sendingEmail) {
      return;
    }

    setSendingEmail(true);
    setEmailStatus(null);
    setError(null);
    try {
      const res = await api.post("/email", {
        to: recipients,
        subject: emailSubject,
        text: emailText,
      });
      setEmailStatus(`Decree delivered from ${res.data?.from || "testing@nofeed.zone"}. The palace is unbearable now.`);
    } catch (err: any) {
      setEmailStatus(null);
      setError(err.response?.data?.error || "The royal courier tripped on the stairs.");
    } finally {
      setSendingEmail(false);
    }
  };

  const maxFrequency = Math.max(1, ...(overview?.frequency || []).map((item) => item.count));
  const maxHourCount = Math.max(1, ...(patterns?.timeOfDay || []).map((item) => item.count));
  const maxCalendarCount = Math.max(1, ...(patterns?.calendar || []).map((day) => day.entryCount));

  return (
    <>
      <Navbar />
      <main className="mood-lab">
        <section className="lab-hero">
          <div>
            <p className="lab-kicker">NoFeed field observatory</p>
            <h1>Mood Lab</h1>
            <p className="lab-thesis">
              Assumption: a no-feed network is a better instrument than an endless feed. Posts are field notes,
              mood tags are variables, analytics are the microscope, and scheduled events keep the experiment alive.
            </p>
          </div>
          <div className="lab-orbit" aria-hidden="true">
            <span style={{ "--i": 0 } as React.CSSProperties}></span>
            <span style={{ "--i": 1 } as React.CSSProperties}></span>
            <span style={{ "--i": 2 } as React.CSSProperties}></span>
            <span style={{ "--i": 3 } as React.CSSProperties}></span>
            <strong>{totalSignals}</strong>
            <small>signals</small>
          </div>
        </section>

        <section className="lab-controls" aria-label="Mood analytics filters">
          <label>
            Start
            <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            End
            <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <label>
            Timezone
            <input className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </label>
          <button className={`button is-primary ${status === "loading" ? "is-loading" : ""}`} onClick={loadLab}>
            <span className="icon"><i className="fas fa-sync-alt"></i></span>
            <span>Refresh</span>
          </button>
        </section>

        {error && <div className="lab-alert">{error}</div>}

        <section className="lab-grid">
          <article className="lab-panel lab-panel-wide">
            <div className="panel-heading">
              <div>
                <p>read-only instrument</p>
                <h2>Mood constellation</h2>
              </div>
              <span>{constellation.length || tags.length} variables</span>
            </div>

            <div className="constellation-wrap">
              <div className="constellation" aria-label="Mood co-occurrence graph">
                {relatedEdges.map((edge, index) => {
                  const source = constellation.find((node) => node.id === edge.source);
                  const target = constellation.find((node) => node.id === edge.target);
                  if (!source || !target) {
                    return null;
                  }
                  const dx = target.x - source.x;
                  const dy = target.y - source.y;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                  return (
                    <span
                      className="constellation-edge"
                      key={`${edge.source}-${edge.target}-${index}`}
                      style={{
                        left: `${source.x}%`,
                        top: `${source.y}%`,
                        width: `${length}%`,
                        transform: `rotate(${angle}deg)`,
                        opacity: Math.min(0.9, 0.24 + edge.weight / 8),
                      }}
                    />
                  );
                })}
                {constellation.map((node) => (
                  <button
                    className={`constellation-node ${node.id === activeTag ? "is-active" : ""}`}
                    key={node.id}
                    type="button"
                    onClick={() => {
                      setSelectedTag(node.id);
                      const firstEntry = entries.find((entry) => getTagNames(entry).includes(node.id));
                      setSelectedEntryId(firstEntry?.id || null);
                    }}
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      width: node.size,
                      height: node.size,
                    }}
                    title={`${node.id}: ${node.count} observations`}
                  >
                    <span>{node.id}</span>
                  </button>
                ))}
                {constellation.length === 0 && <p className="muted constellation-empty">No co-occurrence signal yet.</p>}
              </div>
              <aside className="constellation-inspector">
                <p className="lab-kicker">selected variable</p>
                <h3>{activeNode?.id || activeTag || "No signal"}</h3>
                <strong>{activeNode?.count || topTag?.count || 0}</strong>
                <span>observations in the graph</span>
                <div className="related-tags">
                  {relatedEdges.slice(0, 5).map((edge) => {
                    const related = edge.source === activeTag ? edge.target : edge.source;
                    return (
                      <button key={`${edge.source}-${edge.target}`} type="button" onClick={() => setSelectedTag(related)}>
                        {related}<b>{edge.weight}</b>
                      </button>
                    );
                  })}
                  {relatedEdges.length === 0 && <small>No co-occurring tags yet.</small>}
                </div>
                <button className="button is-light" type="button" onClick={createRhythmEvent}>
                  <span className="icon"><i className="fas fa-clock"></i></span>
                  <span>Schedule review</span>
                </button>
              </aside>
            </div>
            {automationStatus && <p className="micro-status">{automationStatus}</p>}
          </article>

          <article className="lab-panel stat-panel">
            <p>API pulse</p>
            <strong>{healthVersion || "online"}</strong>
            <span>{currentUser?.role || "member"} session</span>
          </article>

          <article className="lab-panel stat-panel">
            <p>entries</p>
            <strong>{overview?.totalEntries || entries.length}</strong>
            <span>{overview?.totalTagsApplied || 0} tags applied</span>
          </article>

          <article className="lab-panel stat-panel">
            <p>top variable</p>
            <strong>{topTag?.tag || "unknown"}</strong>
            <span>{topTag?.count || 0} observations</span>
          </article>
        </section>

        <section className="lab-grid">
          <article className="lab-panel">
            <div className="panel-heading">
              <div>
                <p>overview analytics</p>
                <h2>Frequency spectrum</h2>
              </div>
            </div>
            <div className="frequency-list">
              {(overview?.frequency || []).slice(0, 8).map((item) => (
                <div className="frequency-row" key={item.tag}>
                  <button type="button" onClick={() => setSelectedTag(item.tag)}>{item.tag}</button>
                  <div><i style={{ width: `${(item.count / maxFrequency) * 100}%` }} /></div>
                  <b>{item.count}</b>
                </div>
              ))}
              {(overview?.frequency || []).length === 0 && <p className="muted">No frequency data yet.</p>}
            </div>
          </article>

          <article className="lab-panel">
            <div className="panel-heading">
              <div>
                <p>insight analytics</p>
                <h2>Transitions</h2>
              </div>
            </div>
            <div className="transition-list">
              {(insights?.transitions || []).slice(0, 6).map((transition) => (
                <button
                  className="transition-row"
                  key={`${transition.from}-${transition.to}`}
                  type="button"
                  onClick={() => setSelectedTag(transition.to)}
                >
                  <span>{transition.from}</span>
                  <i className="fas fa-arrow-right"></i>
                  <span>{transition.to}</span>
                  <b>{transition.count}</b>
                </button>
              ))}
              {(insights?.transitions || []).length === 0 && <p className="muted">No transitions yet.</p>}
            </div>
          </article>

          <article className="lab-panel">
            <div className="panel-heading">
              <div>
                <p>pattern analytics</p>
                <h2>Time-of-day peaks</h2>
              </div>
            </div>
            <div className="hour-grid">
              {(patterns?.timeOfDay || []).slice(0, 24).map((point, index) => (
                <div className="hour-bar" key={`${point.hour}-${point.tag}-${index}`}>
                  <i style={{ height: `${Math.max(8, (point.count / maxHourCount) * 100)}%` }} />
                  <span>{point.hour}</span>
                </div>
              ))}
              {(patterns?.timeOfDay || []).length === 0 && <p className="muted">No hourly pattern yet.</p>}
            </div>
          </article>
        </section>

        <section className="lab-grid">
          <article className="lab-panel lab-panel-wide">
            <div className="panel-heading">
              <div>
                <p>entry microscope</p>
                <h2>Observation drawer</h2>
              </div>
              <span>{matchingEntries.length} matches</span>
            </div>
            <div className="microscope">
              <div className="entry-stack">
                {(matchingEntries.length > 0 ? matchingEntries : entries).slice(0, 7).map((entry) => (
                  <button
                    className={`entry-card ${activeEntry?.id === entry.id ? "is-active" : ""}`}
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedEntryId(entry.id)}
                  >
                    <div>
                      <strong>{getEntrySignal(entry)}</strong>
                      <span>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "time unknown"}</span>
                    </div>
                    <i className="fas fa-microscope"></i>
                  </button>
                ))}
                {entries.length === 0 && <p className="muted">No mood entries were returned for this window.</p>}
              </div>

              <aside className="entry-detail">
                <p className="lab-kicker">active specimen</p>
                <h3>{activeEntry ? getEntrySignal(activeEntry) : "No entry selected"}</h3>
                <p>{activeEntry?.note || "No note attached to this observation."}</p>
                <div className="specimen-tags">
                  {(activeEntry?.tags || []).map((tag) => (
                    <button key={tag.id} type="button" onClick={() => setSelectedTag(tag.name)}>
                      {tag.name}
                    </button>
                  ))}
                </div>
                <dl>
                  <div>
                    <dt>Recorded</dt>
                    <dd>{activeEntry?.createdAt ? new Date(activeEntry.createdAt).toLocaleString() : "unknown"}</dd>
                  </div>
                  <div>
                    <dt>Dominant hours</dt>
                    <dd>
                      {dominantHours.length > 0
                        ? dominantHours.map((point) => `${formatHour(point.hour)} (${point.count})`).join(", ")
                        : "not enough signal"}
                    </dd>
                  </div>
                </dl>
                <div className="nearby-notes">
                  <strong>Nearest field notes</strong>
                  {nearbyPosts.map((post) => (
                    <p key={post.id}>{post.content || post.title || "Untitled note"}</p>
                  ))}
                  {nearbyPosts.length === 0 && <span>No nearby posts found.</span>}
                </div>
              </aside>
            </div>
          </article>

          <article className="lab-panel">
            <div className="panel-heading">
              <div>
                <p>calendar pattern</p>
                <h2>Observation heat</h2>
              </div>
            </div>
            <div className="calendar-strip">
              {(patterns?.calendar || []).slice(-21).map((day) => (
                <span
                  key={day.date}
                  title={`${day.date}: ${day.entryCount}`}
                  style={{ opacity: 0.25 + (day.entryCount / maxCalendarCount) * 0.75 }}
                />
              ))}
              {(patterns?.calendar || []).length === 0 && <p className="muted">No calendar signal yet.</p>}
            </div>
          </article>
        </section>

        <section className="lab-grid">
          <article className="lab-panel">
            <div className="panel-heading">
              <div>
                <p>posts endpoint</p>
                <h2>Field notes</h2>
              </div>
              <span>{posts.length}</span>
            </div>
            <div className="mini-list">
              {posts.slice(0, 4).map((post) => (
                <p key={post.id}>{post.content || post.title || "Untitled note"}</p>
              ))}
              {posts.length === 0 && <p className="muted">No posts found.</p>}
            </div>
          </article>

          <article className="lab-panel lab-panel-wide imperial-dispatch">
            <div className="panel-heading">
              <div>
                <p>post /email</p>
                <h2>Imperial dispatch</h2>
              </div>
              <span>testing@nofeed.zone</span>
            </div>

            <div className="decree-presets" aria-label="Dispatch tone presets">
              {decreePresets.map((preset) => (
                <button key={preset.label} type="button" onClick={() => applyDecreePreset(preset)}>
                  {preset.label}
                </button>
              ))}
            </div>

            <form className="decree-form" onSubmit={sendRoyalEmail}>
              <label>
                Recipient court
                <input
                  className="input"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="person@example.com, advisor@example.com"
                />
              </label>
              <label>
                Subject, obviously
                <input
                  className="input"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </label>
              <label className="decree-body">
                Scroll of importance
                <textarea
                  className="textarea"
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  rows={6}
                />
              </label>
              <div className="decree-footer">
                <span>From the palace mailroom, with excessive posture.</span>
                <button
                  className={`button is-primary ${sendingEmail ? "is-loading" : ""}`}
                  type="submit"
                  disabled={sendingEmail || !emailTo.trim() || !emailSubject.trim() || !emailText.trim()}
                >
                  <span className="icon"><i className="fas fa-crown"></i></span>
                  <span>Send decree</span>
                </button>
              </div>
            </form>
            {emailStatus && <p className="micro-status decree-status">{emailStatus}</p>}
          </article>

          <article className="lab-panel">
            <div className="panel-heading">
              <div>
                <p>events endpoint</p>
                <h2>Scheduled experiments</h2>
              </div>
              <span>{events.length}</span>
            </div>
            <div className="mini-list">
              {events.slice(0, 4).map((event) => (
                <p key={`${event.name}-${event.schedule}`}>{event.name} <small>{event.schedule}</small></p>
              ))}
              {events.length === 0 && <p className="muted">No scheduled events found.</p>}
            </div>
          </article>

          <article className="lab-panel">
            <div className="panel-heading">
              <div>
                <p>discord-ping</p>
                <h2>Signal flare</h2>
              </div>
            </div>
            <button className="button is-light" onClick={pingDiscord}>
              <span className="icon"><i className="fab fa-discord"></i></span>
              <span>Ping webhook</span>
            </button>
            {discordStatus && <p className="micro-status">{discordStatus}</p>}
          </article>
        </section>

        <section className="lab-panel endpoint-map">
          <div className="panel-heading">
            <div>
              <p>swagger synthesis</p>
              <h2>All endpoints, one product theory</h2>
            </div>
            <a href="https://api.nofeed.zone/swagger/index.html" target="_blank" rel="noopener noreferrer">
              Swagger
            </a>
          </div>
          <div className="endpoint-groups">
            {Object.entries(endpointsByGroup).map(([group, endpoints]) => (
              <div className="endpoint-group" key={group}>
                <h3 style={{ color: endpointTone[group] }}>{group}</h3>
                {endpoints.map((endpoint) => (
                  <div className="endpoint-row" key={`${endpoint.method}-${endpoint.path}`}>
                    <b>{endpoint.method}</b>
                    <code>{endpoint.path}</code>
                    <span>{endpoint.use}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default MoodLabPage;
