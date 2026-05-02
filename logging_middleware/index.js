const DEFAULT_BASE_URL = "http://20.207.122.201/evaluation-service";

const allowedStacks = new Set(["frontend", "backend"]);
const allowedLevels = new Set(["debug", "info", "warn", "error", "fatal"]);
const allowedPackages = new Set([
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils"
]);

function normalise(value) {
  return String(value || "").trim().toLowerCase();
}

function getAuthToken() {
  const envToken =
    typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_EVALUATION_AUTH_TOKEN;
  const globalToken = globalThis.__EVALUATION_AUTH_TOKEN__;

  return String(globalToken || envToken || "").trim();
}

function authHeaders() {
  const token = getAuthToken();
  if (!token) return {};

  return {
    Authorization: token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`
  };
}

async function Log(stack, level, packageName, message) {
  if (!getAuthToken()) {
    return {
      ok: false,
      status: 0,
      error: "Remote log skipped because VITE_EVALUATION_AUTH_TOKEN is missing"
    };
  }

  const payload = {
    stack: normalise(stack),
    level: normalise(level),
    package: normalise(packageName || "utils"),
    message: String(message || "").trim()
  };

  if (!allowedStacks.has(payload.stack)) {
    payload.stack = "frontend";
  }

  if (!allowedLevels.has(payload.level)) {
    payload.level = "info";
  }

  if (!allowedPackages.has(payload.package)) {
    payload.package = "utils";
  }

  if (!payload.message) {
    payload.message = "Log event emitted without a message";
  }

  const baseUrl =
    globalThis.__LOG_API_BASE_URL__ ||
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_LOG_API_BASE_URL) ||
    DEFAULT_BASE_URL;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders()
      },
      body: JSON.stringify(payload)
    });

    return {
      ok: response.ok,
      status: response.status
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "Unknown logging failure"
    };
  }
}

export { Log };
export default Log;
