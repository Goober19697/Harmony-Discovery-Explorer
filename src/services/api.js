const API_BASE_URL = "http://127.0.0.1:5000";

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
