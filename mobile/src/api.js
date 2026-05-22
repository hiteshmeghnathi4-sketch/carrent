import { API_BASE_URL } from "./config";

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let requestBody = body;

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: requestBody,
  });

  const rawText = await response.text();
  let payload = {};

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch (error) {
      payload = {
        error: rawText,
      };
    }
  }

  if (!response.ok) {
    const failure = new Error(payload.error || `Request failed with status ${response.status}`);
    failure.status = response.status;
    failure.payload = payload;
    throw failure;
  }

  return payload;
}
