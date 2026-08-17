function getApiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Keep the API hostname identical to the page hostname. This is essential
  // for the browser to send the HTTP-only session cookie in local development.
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }

  return 'http://127.0.0.1:4000';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });

  if (response.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
    // Navigation is already underway; never resolve so callers don't also
    // race to render an error state for a page that's about to unmount.
    return new Promise<T>(() => {});
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || 'Request failed');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export async function login(mobile: string, password: string) {
  return request<{ token: string; user: { id: number; mobile: string; name: string | null } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ mobile, password }),
  });
}

export async function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}

export async function fetchDashboardSummary() {
  return request<any>('/api/dashboard/summary');
}

export async function fetchDashboardFloors() {
  return request<any>('/api/dashboard/floors');
}

export async function fetchDashboardVacant() {
  return request<any>('/api/dashboard/vacant');
}

export async function fetchTopTenants() {
  return request<any>('/api/dashboard/top-tenants');
}

export async function fetchRentals(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return request<any>(`/api/rentals${query.toString() ? `?${query.toString()}` : ''}`);
}

export async function fetchAvailableRooms(building: string, floor: string | number) {
  return request<string[]>(`/api/rentals/rooms?building=${encodeURIComponent(building)}&floor=${floor}`);
}

export async function createRental(payload: Record<string, unknown>) {
  return request<any>('/api/rentals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchRental(id: string | number) {
  return request<{ record: any }>(`/api/rentals/${id}`);
}

export async function updateRental(id: string | number, payload: Record<string, unknown>) {
  return request<{ record: any }>(`/api/rentals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteRental(id: string | number) {
  return request<void>(`/api/rentals/${id}`, { method: 'DELETE' });
}

export async function exportRentals() {
  window.location.href = `${getApiBase()}/api/rentals/export`;
}
