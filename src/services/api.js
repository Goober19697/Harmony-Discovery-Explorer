const configuredApiBaseUrl = import.meta.env?.VITE_API_BASE_URL?.replace(/\/+$/, "");
if (import.meta.env?.PROD && !configuredApiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is required for production builds.");
}
const API_BASE_URL = configuredApiBaseUrl || "/api";

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let savedRequestUnauthorizedHandler = null;

export function setSavedRequestUnauthorizedHandler(handler) {
  savedRequestUnauthorizedHandler = handler;
}

async function apiRequest(path, options = {}, handleSavedUnauthorized = false) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the server.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (
      handleSavedUnauthorized
      && response.status === 401
      && savedRequestUnauthorizedHandler
    ) {
      savedRequestUnauthorizedHandler();
    }
    throw new ApiError(
      data.error || `Backend returned status ${response.status}`,
      response.status,
    );
  }
  return data;
}

export function registerUser(data) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function loginUser(data) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logoutUser() {
  return apiRequest("/auth/logout", { method: "POST" });
}

export function getCurrentUser() {
  return apiRequest("/auth/me");
}

export async function checkBackendHealth() {
  try {
    return await apiRequest("/health");
  } catch (error) {
    if (error instanceof ApiError && error.status === 503) {
      throw new ApiError("The server is running, but its database is unavailable.", 503);
    }
    throw error;
  }
}

export async function saveVoicing(voicing) {
  return apiRequest("/voicings", {
    method: "POST",
    body: JSON.stringify(voicing),
  }, true);
}

export async function getSavedVoicings() {
  return apiRequest("/voicings", {}, true);
}

export async function saveProgression(progression) {
  return apiRequest("/progressions", {
    method: "POST",
    body: JSON.stringify(progression),
  }, true);
}

export async function getSavedProgressions() {
  return apiRequest("/progressions", {}, true);
}

export async function updateProgression(progressionId, payload) {
  return apiRequest(`/progressions/${progressionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export function updateSavedProgression(progressionId, progression) {
  return updateProgression(progressionId, { progression });
}

export async function updateVoicing(voicingId, payload) {
  return apiRequest(`/voicings/${voicingId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

async function deleteSavedRecord(path) {
  return apiRequest(path, { method: "DELETE" }, true);
}

export function deleteSavedVoicing(voicingId) {
  return deleteSavedRecord(`/voicings/${voicingId}`);
}

export function deleteSavedProgression(progressionId) {
  return deleteSavedRecord(`/progressions/${progressionId}`);
}
