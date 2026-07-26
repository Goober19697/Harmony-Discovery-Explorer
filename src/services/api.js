const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "http://localhost:5000";

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function authRequest(path, options = {}) {
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
    throw new ApiError("Unable to reach the authentication server.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      data.error || "The authentication request could not be completed.",
      response.status,
    );
  }
  return data;
}

export function registerUser(data) {
  return authRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function loginUser(data) {
  return authRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logoutUser() {
  return authRequest("/api/auth/logout", { method: "POST" });
}

export function getCurrentUser() {
  return authRequest("/api/auth/me");
}

export async function checkBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error(`Backend returned status ${response.status}`);
  }

  return response.json();
}

export async function saveVoicing(voicing) {
  const response = await fetch(`${API_BASE_URL}/api/voicings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(voicing),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Backend returned status ${response.status}`);
  }

  return data;
}

export async function getSavedVoicings() {
  const response = await fetch(`${API_BASE_URL}/api/voicings`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Backend returned status ${response.status}`);
  }

  return data;
}

export async function saveProgression(progression) {
  const response = await fetch(`${API_BASE_URL}/api/progressions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(progression),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Backend returned status ${response.status}`);
  }

  return data;
}

export async function getSavedProgressions() {
  const response = await fetch(`${API_BASE_URL}/api/progressions`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Backend returned status ${response.status}`);
  }

  return data;
}

export async function updateProgression(progressionId, payload) {
  const response = await fetch(`${API_BASE_URL}/api/progressions/${progressionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Backend returned status ${response.status}`);
  }

  return data;
}

export function updateSavedProgression(progressionId, progression) {
  return updateProgression(progressionId, { progression });
}

export async function updateVoicing(voicingId, payload) {
  const response = await fetch(`${API_BASE_URL}/api/voicings/${voicingId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Backend returned status ${response.status}`);
  }
  return data;
}

async function deleteSavedRecord(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, { method: "DELETE" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Backend returned status ${response.status}`);
  }
  return data;
}

export function deleteSavedVoicing(voicingId) {
  return deleteSavedRecord(`/api/voicings/${voicingId}`);
}

export function deleteSavedProgression(progressionId) {
  return deleteSavedRecord(`/api/progressions/${progressionId}`);
}
