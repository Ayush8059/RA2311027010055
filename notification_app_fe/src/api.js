const API_BASE_URL = import.meta.env.VITE_NOTIFICATION_API_BASE_URL || "http://20.207.122.201/evaluation-service";

function getAuthToken() {
  return String(import.meta.env.VITE_EVALUATION_AUTH_TOKEN || "").trim();
}

export function hasAuthToken() {
  return Boolean(getAuthToken());
}

function getAuthHeaders() {
  const token = getAuthToken();
  if (!token) return {};

  return {
    Authorization: token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`
  };
}

function extractNotifications(payload) {
  if (Array.isArray(payload)) {
    return { notifications: payload };
  }

  if (Array.isArray(payload.notifications)) {
    return { notifications: payload.notifications, total: payload.total };
  }

  if (Array.isArray(payload.data)) {
    return { notifications: payload.data, total: payload.total };
  }

  if (payload.data && !Array.isArray(payload.data) && Array.isArray(payload.data.notifications)) {
    return { notifications: payload.data.notifications, total: payload.data.total ?? payload.total };
  }

  return { notifications: [] };
}

export async function fetchNotifications(query) {
  if (!hasAuthToken()) {
    throw new Error("Missing API token. Add VITE_EVALUATION_AUTH_TOKEN in notification_app_fe/.env and restart Vite.");
  }

  const params = new URLSearchParams({
    limit: String(query.limit),
    page: String(query.page)
  });

  if (query.notification_type !== "All") {
    params.set("notification_type", query.notification_type);
  }

  const url = `${API_BASE_URL.replace(/\/$/, "")}/notifications?${params.toString()}`;

  const response = await fetch(url, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized. Check that VITE_EVALUATION_AUTH_TOKEN is correct and restart Vite.");
    }

    throw new Error(`Request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const result = extractNotifications(payload);
  return result;
}
