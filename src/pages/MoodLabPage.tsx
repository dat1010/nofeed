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
  { method: "POST", path: "/mood-tags", group: "moods", use: "new custom variable" },
  { method: "GET", path: "/mood-entries", group: "moods", use: "raw mood observations" },
  { method: "POST", path: "/mood-entries", group: "moods", use: "record an observation" },
  { method: "GET", path: "/mood-entries/{id}", group: "moods", use: "hydrate one observation" },
  { method: "PUT", path: "/mood-entries/{id}", group: "moods", use: "revise observation tags or note" },
  { method: "GET", path: "/moods/analytics/overview", group: "analytics", use: "frequency totals" },
  { method: "GET", path: "/moods/analytics/insights", group: "analytics", use: "co-occurrence and transitions" },
  { method: "GET", path: "/moods/analytics/patterns", group: "analytics", use: "time and calendar patterns" },
  { method: "GET", path: "/events", group: "automation", use: "scheduled experiments" },
  { method: "POST", path: "/events", group: "automation", use: "create recurring prompts" },
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
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [start, setStart] = useState(getDefaultStart);
  const [end, setEnd] = useState(getDefaultEnd);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
  );
  const [savingEntry, setSavingEntry] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<string | null>(null);
  const [discordStatus, setDiscordStatus] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");

  const analyticsParams = useMemo(
    () => ({
      start,
      end,
      timezone,
    }),
    [start, end, timezone]
  );

  const topTag = overview?.frequency?.[0];
  const totalSignals = (overview?.totalEntries || 0) + posts.length + events.length;
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
      setSelectedTagIds((prev) => prev.filter((id) => nextTags.some((tag) => tag.id === id)));
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

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTagName.trim();
    if (!name || creatingTag) {
      return;
    }
    setCreatingTag(true);
    setError(null);
    try {
      const res = await api.post<MoodTag>("/mood-tags", { name });
      setTags((prev) => [...prev, res.data]);
      setSelectedTagIds((prev) => [...prev, res.data.id]);
      setNewTagName("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not create that mood tag.");
    } finally {
      setCreatingTag(false);
    }
  };

  const createEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((selectedTagIds.length === 0 && !entryNote.trim()) || savingEntry) {
      return;
    }
    setSavingEntry(true);
    setError(null);
    try {
      await api.post<MoodEntry>("/mood-entries", {
        note: entryNote.trim(),
        tagIds: selectedTagIds,
      });
      setEntryNote("");
      setSelectedTagIds([]);
      await loadLab();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not record the mood observation.");
    } finally {
      setSavingEntry(false);
    }
  };

  const beginEdit = (entry: MoodEntry) => {
    setEditingEntryId(entry.id);
    setEditingNote(entry.note || "");
  };

  const updateEntry = async (entry: MoodEntry) => {
    setError(null);
    try {
      await api.put(`/mood-entries/${encodeURIComponent(entry.id)}`, {
        note: editingNote.trim(),
        tagIds: (entry.tags || []).map((tag) => tag.id),
      });
      setEditingEntryId(null);
      setEditingNote("");
      await loadLab();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not update that mood observation.");
    }
  };

  const createRhythmEvent = async () => {
    const variable = topTag?.tag || tags[0]?.name || "mood-check";
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
                <p>active instrument</p>
                <h2>Record an observation</h2>
              </div>
              <span>{tags.length} variables</span>
            </div>

            <form className="tag-maker" onSubmit={createTag}>
              <input
                className="input"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Add variable: calm, wired, focused..."
              />
              <button className={`button is-light ${creatingTag ? "is-loading" : ""}`} type="submit">
                <span className="icon"><i className="fas fa-plus"></i></span>
              </button>
            </form>

            <form onSubmit={createEntry}>
              <div className="tag-cloud">
                {tags.map((tag) => (
                  <button
                    className={`mood-chip ${selectedTagIds.includes(tag.id) ? "is-selected" : ""}`}
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </button>
                ))}
                {tags.length === 0 && <p className="muted">No mood tags yet. Create the first variable.</p>}
              </div>

              <textarea
                className="textarea lab-note"
                value={entryNote}
                onChange={(e) => setEntryNote(e.target.value)}
                placeholder="What changed in the system?"
                rows={3}
              />
              <div className="lab-actions">
                <button
                  className={`button is-primary ${savingEntry ? "is-loading" : ""}`}
                  type="submit"
                  disabled={savingEntry || (selectedTagIds.length === 0 && !entryNote.trim())}
                >
                  <span className="icon"><i className="fas fa-flask"></i></span>
                  <span>Log signal</span>
                </button>
                <button className="button is-light" type="button" onClick={createRhythmEvent}>
                  <span className="icon"><i className="fas fa-clock"></i></span>
                  <span>Schedule rhythm</span>
                </button>
              </div>
            </form>
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
                  <span>{item.tag}</span>
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
                <div className="transition-row" key={`${transition.from}-${transition.to}`}>
                  <span>{transition.from}</span>
                  <i className="fas fa-arrow-right"></i>
                  <span>{transition.to}</span>
                  <b>{transition.count}</b>
                </div>
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
                <p>mood entries</p>
                <h2>Recent observations</h2>
              </div>
            </div>
            <div className="entry-stack">
              {entries.slice(0, 6).map((entry) => (
                <div className="entry-card" key={entry.id}>
                  <div>
                    <strong>{getEntrySignal(entry)}</strong>
                    <span>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "time unknown"}</span>
                  </div>
                  {editingEntryId === entry.id ? (
                    <div className="entry-editor">
                      <input className="input" value={editingNote} onChange={(e) => setEditingNote(e.target.value)} />
                      <button className="button is-primary" onClick={() => updateEntry(entry)}>Save</button>
                    </div>
                  ) : (
                    <button className="button is-light" onClick={() => beginEdit(entry)}>
                      <span className="icon"><i className="fas fa-pen"></i></span>
                    </button>
                  )}
                </div>
              ))}
              {entries.length === 0 && <p className="muted">The notebook is empty. Log the first signal above.</p>}
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
