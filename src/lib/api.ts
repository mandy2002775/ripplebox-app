export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

// Set by AuthProvider on mount. A 401 on an authenticated request means the
// token is dead (expired/revoked) — every screen would otherwise need its
// own logic to notice that and sign the user out; this makes it happen once,
// centrally, no matter which screen's request happened to be the one that
// got the 401.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function handleUnauthorized(status: number, hadToken: boolean) {
  if (status === 401 && hadToken) {
    onUnauthorized?.();
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    handleUnauthorized(response.status, !!options.token);
    throw new ApiError(
      response.status,
      data?.message ?? 'Something went wrong. Please try again.',
      data?.errors
    );
  }

  return data as T;
}

/**
 * For endpoints that take a file upload (multipart/form-data) rather than
 * JSON — fetch sets its own Content-Type boundary for FormData, so it must
 * not be set manually here.
 */
export async function apiUploadRequest<T>(
  path: string,
  form: FormData,
  token?: string | null
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    handleUnauthorized(response.status, !!token);
    throw new ApiError(
      response.status,
      data?.message ?? 'Something went wrong. Please try again.',
      data?.errors
    );
  }

  return data as T;
}

/**
 * For endpoints that return a file (CSV/PDF export) rather than JSON.
 */
export async function apiBlobRequest(path: string, token?: string | null): Promise<Blob> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    handleUnauthorized(response.status, !!token);
    throw new ApiError(response.status, 'Could not download this file.');
  }

  return response.blob();
}
