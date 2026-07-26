const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5001";

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
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function loginUser(data) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logoutUser() {
  return apiRequest("/api/auth/logout", { method: "POST" });
}

export function getCurrentUser() {
  return apiRequest("/api/auth/me");
}

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Backend returned status ${response.status}`);
  }

  return response.json();
}

export async function saveVoicing(voicing) {
  return apiRequest("/api/voicings", {
    method: "POST",
    body: JSON.stringify(voicing),
  }, true);
}

export async function getSavedVoicings() {
  return apiRequest("/api/voicings", {}, true);
}

export async function saveProgression(progression) {
  return apiRequest("/api/progressions", {
    method: "POST",
    body: JSON.stringify(progression),
  }, true);
}

export async function getSavedProgressions() {
  return apiRequest("/api/progressions", {}, true);
}

export async function updateProgression(progressionId, payload) {
  return apiRequest(`/api/progressions/${progressionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export function updateSavedProgression(progressionId, progression) {
  return updateProgression(progressionId, { progression });
}

export async function updateVoicing(voicingId, payload) {
  return apiRequest(`/api/voicings/${voicingId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

async function deleteSavedRecord(path) {
  return apiRequest(path, { method: "DELETE" }, true);
}

export function deleteSavedVoicing(voicingId) {
  return deleteSavedRecord(`/api/voicings/${voicingId}`);
}

export function deleteSavedProgression(progressionId) {
  return deleteSavedRecord(`/api/progressions/${progressionId}`);
}
