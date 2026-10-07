// Browser-side API client. Calls the same-origin /api proxy so the HTTP-only auth cookie is sent automatically.
export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const TIMEOUT_MS = 20000;

export async function api(path, { method = 'GET', body, formData, signal, timeout = formData ? 120000 : TIMEOUT_MS } = {}) {
  // Every request has a deadline, so a server that stops answering shows an error instead of an endless spinner.
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, timeout);
  const onAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      signal: ctrl.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: formData || (body ? JSON.stringify(body) : undefined),
    });
  } catch (e) {
    if (timedOut) throw new ApiError('The server is taking too long to respond. Check that the API is running, then try again.', 0, 'TIMEOUT');
    if (e.name === 'AbortError') throw e;
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0, 'NETWORK');
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    /* non-JSON response */
  }
  if (!res.ok || !json || json.success === false) {
    const err = (json && json.error) || {};
    // A non-JSON 5xx comes from the Next.js proxy when the Express API is down.
    const fallback = !json && res.status >= 500 ? 'The API server is not responding. Make sure the backend is running.' : 'Something went wrong. Try again.';
    throw new ApiError((json && json.message) || fallback, res.status, err.code || (!json && res.status >= 500 ? 'API_DOWN' : undefined), err.details);
  }
  return json;
}

// Maps a validation error (422) to { field: message } for forms.
export const fieldErrors = (e) => (e && Array.isArray(e.details) ? Object.fromEntries(e.details.filter((d) => d.field).map((d) => [d.field, d.message])) : {});
