import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// ─── Instance ─────────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL:         import.meta.env.VITE_API_BASE ?? '/api',
  timeout:         15_000,
  headers:         { 'Content-Type': 'application/json' },
  // CRITICAL SECURITY FIX: Allow cookies to be sent across origins
  withCredentials: true,
});

// ─── REQUEST: No token attachment needed ──────────────────────────────────────
// Removed the interceptor that manually extracted the token from localStorage
// The browser will automatically attach the HttpOnly cookie to every request.

// ─── RESPONSE: normalise errors ───────────────────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      toast.error('Sin conexión con el servidor. Verificá tu red.');
      return Promise.reject(normalizeError(error));
    }

    const { status, data } = error.response as AxiosResponse;
    const message = Array.isArray(data?.message) 
      ? data.message[0] 
      : (data?.message ?? error.message);

    switch (status) {
      case 400: toast.error(message); break;
      case 401:
        // Removed localStorage.removeItem('erp_token') since it doesn't exist there anymore.
        // The backend handles clearing the cookie via the /auth/logout endpoint if needed,
        // or the session naturally dies. We just redirect.
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/setup')) {
          toast.error('Tu sesión expiró. Volvé a iniciar sesión.');
          window.location.replace('/login');
        }
        break;
      case 403:
        toast.error('No tenés permiso para esta acción.');
        window.dispatchEvent(new CustomEvent('erp:forbidden'));
        break;
      case 404: /* let callers handle */ break;
      case 409: toast.error(message || 'Conflicto: el recurso ya existe.'); break;
      case 422: toast.error(message || 'Datos inválidos.'); break;
      case 429: toast.error('Demasiadas solicitudes. Esperá unos segundos.'); break;
      default:
        if (status >= 500) toast.error(`Error del servidor (${status}).`);
    }

    return Promise.reject(normalizeError(error, message));
  }
);

// ─── Normalised error shape consumed by React Query onError ──────────────────
export interface ApiError {
  status:  number | null;
  message: string;
  raw:     unknown;
}

function normalizeError(error: unknown, message?: string): ApiError {
  const axiosError = error as { response?: { status?: number }; message?: string };
  return {
    status:  axiosError?.response?.status ?? null,
    message: message ?? axiosError?.message ?? 'Error desconocido',
    raw:     error,
  };
}

// ─── Low-level helpers (used by typed services) ───────────────────────────────

/** GET request — returns typed data directly */
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.get<T>(url, config);
  return data;
}

/** POST request */
export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.post<T>(url, body, config);
  return data;
}

/** PATCH request */
export async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.patch<T>(url, body, config);
  return data;
}

/** PUT request */
export async function put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.put<T>(url, body, config);
  return data;
}

/** DELETE request */
export async function del<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.delete<T>(url, config);
  return data;
}

/**
 * Multipart file upload.
 * Automatically sets Content-Type: multipart/form-data.
 */
export async function upload<T>(
  url: string,
  file: File,
  fieldName = 'file',
  extra?: Record<string, string>
): Promise<T> {
  const form = new FormData();
  form.append(fieldName, file);
  if (extra) Object.entries(extra).forEach(([k, v]) => form.append(k, v));

  const { data } = await apiClient.post<T>(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
