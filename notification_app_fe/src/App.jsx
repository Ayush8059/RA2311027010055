import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchNotifications } from "./api.js";

const notificationTypes = ["All", "Event", "Result", "Placement"];
const pageSizes = [10, 20, 30];
const inboxSizes = [5, 10, 15, 20];
const typeRank = {
  Placement: 3,
  Result: 2,
  Event: 1
};

function getType(item) {
  return String(item.notification_type || item.type || item.Type || "Event");
}

function getTitle(item) {
  return String(item.title || item.Title || `${getType(item)} notification`);
}

function getMessage(item) {
  return String(item.message || item.Message || item.description || item.Description || "No message was provided.");
}

function getTimestamp(item) {
  const raw = item.created_at || item.createdAt || item.Timestamp || item.timestamp;
  if (!raw) return "Recently";

  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) return String(raw);

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getTimeValue(item) {
  const raw = item.created_at || item.createdAt || item.Timestamp || item.timestamp;
  const date = new Date(String(raw || ""));
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getPriority(item) {
  const value = item.priority ?? item.Priority ?? 0;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function isRead(item) {
  return Boolean(item.read ?? item.is_read ?? item.IsRead ?? item.Read);
}

function getPriorityInbox(notifications, count) {
  return [...notifications]
    .filter((item) => !isRead(item))
    .sort((a, b) => {
      const priorityDifference = getPriority(b) - getPriority(a);
      if (priorityDifference !== 0) return priorityDifference;

      const typeDifference = (typeRank[getType(b)] || 0) - (typeRank[getType(a)] || 0);
      if (typeDifference !== 0) return typeDifference;

      return getTimeValue(b) - getTimeValue(a);
    })
    .slice(0, count);
}

export function App() {
  const [query, setQuery] = useState({
    limit: 10,
    page: 1,
    notification_type: "All"
  });
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priorityCount, setPriorityCount] = useState(10);

  const totalPages = useMemo(() => {
    if (!total) return undefined;
    return Math.max(1, Math.ceil(total / query.limit));
  }, [query.limit, total]);

  const priorityInbox = useMemo(() => getPriorityInbox(notifications, priorityCount), [notifications, priorityCount]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchNotifications(query);
      setNotifications(result.notifications);
      setTotal(result.total);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to load notifications";
      setError(message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  function updateQuery(next) {
    setQuery((current) => ({ ...current, ...next }));
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <p>Notification Console</p>
        <h1>All Notifications</h1>
      </header>

      <section className="controls" aria-label="Notification controls">
        <div className="type-filter" aria-label="Notification type">
          {notificationTypes.map((type) => (
            <button
              className={query.notification_type === type ? "active" : ""}
              key={type}
              type="button"
              onClick={() => {
                updateQuery({ notification_type: type, page: 1 });
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <label className="select-field">
          <span>Limit</span>
          <select value={query.limit} onChange={(event) => updateQuery({ limit: Number(event.target.value), page: 1 })}>
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Top</span>
          <select value={priorityCount} onChange={(event) => setPriorityCount(Number(event.target.value))}>
            {inboxSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? (
        <section className="state-panel error" role="alert">
          <h2>Could not load notifications</h2>
          <p>{error}</p>
        </section>
      ) : null}

      <section className="priority-section" aria-label="Priority Inbox">
        <div className="section-heading">
          <div>
            <p>Stage 1</p>
            <h2>Priority Inbox</h2>
          </div>
          <span>{priorityInbox.length} unread</span>
        </div>

        <section className="notification-list compact" aria-live="polite" aria-busy={loading}>
          {loading ? (
            <p className="muted">Loading priority notifications...</p>
          ) : priorityInbox.length ? (
            priorityInbox.map((item, index) => {
              const type = getType(item);
              return (
                <article className="notification-card priority" key={String(item.id ?? item.ID ?? `priority-${index}`)}>
                  <div className="notification-header">
                    <span className="type-label">{type}</span>
                    <span className="status-pill new">Unread</span>
                  </div>
                  <h2>{getTitle(item)}</h2>
                  <p>{getMessage(item)}</p>
                  <div className="meta-row">
                    <span>{getTimestamp(item)}</span>
                    <span>Priority: {String(getPriority(item) || "normal")}</span>
                    <span>Rank: {index + 1}</span>
                  </div>
                </article>
              );
            })
          ) : (
            <section className="state-panel">
              <h2>No unread priority notifications</h2>
              <p>New unread notifications will appear here automatically.</p>
            </section>
          )}
        </section>
      </section>

      <div className="section-heading all-heading">
        <div>
          <p>Stage 2</p>
          <h2>All Notifications</h2>
        </div>
      </div>

      <section className="notification-list" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <p className="muted">Loading notifications...</p>
        ) : notifications.length ? (
          notifications.map((item, index) => {
            const type = getType(item);
            const read = isRead(item);
            return (
              <article className={`notification-card ${read ? "read" : "new"}`} key={String(item.id ?? item.ID ?? index)}>
                <div className="notification-header">
                  <span className="type-label">{type}</span>
                  <span className={`status-pill ${read ? "read" : "new"}`}>{read ? "Viewed" : "New"}</span>
                </div>
                <h2>{getTitle(item)}</h2>
                <p>{getMessage(item)}</p>
                <div className="meta-row">
                  <span>{getTimestamp(item)}</span>
                  <span>Priority: {String(getPriority(item) || "normal")}</span>
                </div>
              </article>
            );
          })
        ) : (
          <section className="state-panel">
            <h2>No notifications found</h2>
            <p>Try another notification type or page.</p>
          </section>
        )}
      </section>

      <nav className="pagination" aria-label="Pagination">
        <button
          type="button"
          disabled={query.page <= 1 || loading}
          onClick={() => updateQuery({ page: Math.max(1, query.page - 1) })}
        >
          Previous
        </button>
        <span>
          Page {query.page}
          {totalPages ? ` of ${totalPages}` : ""}
        </span>
        <button
          type="button"
          disabled={Boolean(totalPages && query.page >= totalPages) || loading}
          onClick={() => updateQuery({ page: query.page + 1 })}
        >
          Next
        </button>
      </nav>
    </main>
  );
}
