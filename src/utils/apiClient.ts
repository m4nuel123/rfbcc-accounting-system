import { ERPState, LoginResponse, SelectCompanyResponse } from '../types/erp';

const API_BASE = '/api';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export interface DemoDirectoryEntry {
  id: string;
  username: string;
  passwordHint: string;
  employeeName: string;
  roleLabel: string;
  isAdmin: boolean;
  companies: { id: string; code: string; name: string }[];
}

export async function fetchDemoDirectory(): Promise<DemoDirectoryEntry[]> {
  const res = await apiFetch<{ users: DemoDirectoryEntry[] }>('/auth/demo-directory');
  return res.users;
}

export async function apiLogin(username: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function apiSelectCompany(
  token: string,
  companyId: string
): Promise<SelectCompanyResponse> {
  return apiFetch<SelectCompanyResponse>(
    '/auth/select-company',
    {
      method: 'POST',
      body: JSON.stringify({ companyId }),
    },
    token
  );
}

export async function apiLogout(token: string): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' }, token);
  } catch {
    // Ignore logout transport errors
  }
}

export async function apiFetchState(token: string): Promise<SelectCompanyResponse> {
  return apiFetch<SelectCompanyResponse>('/erp/state', { method: 'GET' }, token);
}

export async function apiCommitState(token: string, state: ERPState): Promise<{ ok: boolean; state: ERPState }> {
  return apiFetch<{ ok: boolean; state: ERPState }>(
    '/erp/commit',
    {
      method: 'POST',
      body: JSON.stringify({ state }),
    },
    token
  );
}
