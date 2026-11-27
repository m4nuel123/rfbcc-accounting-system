import {
  AccountStatus,
  Company,
  DashboardSummaryResponse,
  EmploymentStatus,
  ERPState,
  LoginResponse,
  Project,
  ProjectStatus,
  SafeUserAccount,
  SelectCompanyResponse,
  UserCompanyAccess,
} from '../types/erp';

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
  employeeName: string;
  department: string;
  position: string;
  roleLabel: string;
  isAdmin: boolean;
  mustChangePassword?: boolean;
  initialSetupTempMatchesUsername?: boolean;
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

export async function apiChangePassword(
  token: string,
  payload: { currentPassword: string; newPassword: string; confirmPassword: string }
): Promise<{ ok: boolean; user: SafeUserAccount }> {
  return apiFetch<{ ok: boolean; user: SafeUserAccount }>(
    '/auth/change-password',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
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

export interface AdminUserUpsertPayload {
  username: string;
  temporaryPassword?: string;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  employeeId?: string;
  roleLabel: string;
  isAdmin: boolean;
  accountStatus: AccountStatus;
  employmentStatus: EmploymentStatus;
  mustChangePassword?: boolean;
  companyAccess: UserCompanyAccess[];
}

export async function apiAdminCreateUser(
  token: string,
  payload: AdminUserUpsertPayload
): Promise<{ ok: boolean; user: SafeUserAccount; state: ERPState }> {
  return apiFetch<{ ok: boolean; user: SafeUserAccount; state: ERPState }>(
    '/erp/users',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function apiAdminUpdateUser(
  token: string,
  userId: string,
  payload: Partial<AdminUserUpsertPayload>
): Promise<{ ok: boolean; user: SafeUserAccount; state: ERPState }> {
  return apiFetch<{ ok: boolean; user: SafeUserAccount; state: ERPState }>(
    `/erp/users/${encodeURIComponent(userId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function apiAdminResetPassword(
  token: string,
  userId: string,
  payload: { temporaryPassword?: string; generateRandom?: boolean; forceChange?: boolean }
): Promise<{ ok: boolean; temporaryPassword: string; user: SafeUserAccount; state: ERPState }> {
  return apiFetch<{ ok: boolean; temporaryPassword: string; user: SafeUserAccount; state: ERPState }>(
    `/erp/users/${encodeURIComponent(userId)}/reset-password`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function apiAdminUpdateUserStatus(
  token: string,
  userId: string,
  payload: {
    accountStatus: AccountStatus;
    employmentStatus?: EmploymentStatus;
    clearCompanyAccess?: boolean;
  }
): Promise<{ ok: boolean; user: SafeUserAccount; state: ERPState }> {
  return apiFetch<{ ok: boolean; user: SafeUserAccount; state: ERPState }>(
    `/erp/users/${encodeURIComponent(userId)}/status`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function apiAdminDeleteUser(
  token: string,
  userId: string
): Promise<{ ok: boolean; state: ERPState }> {
  return apiFetch<{ ok: boolean; state: ERPState }>(
    `/erp/users/${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
    },
    token
  );
}

export async function apiFetchDashboardSummary(token: string): Promise<DashboardSummaryResponse> {
  return apiFetch<DashboardSummaryResponse>('/erp/dashboard', { method: 'GET' }, token);
}

export async function apiExportReportCsv(
  token: string,
  payload: {
    filename: string;
    reportName: string;
    columns: string[];
    rows: (string | number)[][];
  }
): Promise<{ ok: boolean; filename: string; csv: string }> {
  return apiFetch<{ ok: boolean; filename: string; csv: string }>(
    '/erp/reports/export-csv',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export type EnrichedProject = Project & {
  companyCode: string;
  companyName: string;
  actualSpend: number;
  isOverdue: boolean;
  daysOverdue: number;
};

export async function apiFetchProjects(
  token: string,
  scope: 'active' | 'consolidated' = 'consolidated',
  companyId?: string
): Promise<{
  projects: EnrichedProject[];
  assignedCompanies: Company[];
  isConsolidatedAvailable: boolean;
  activeCompany: Company;
}> {
  const params = new URLSearchParams({ scope });
  if (companyId) params.set('companyId', companyId);
  return apiFetch(`/erp/projects?${params.toString()}`, { method: 'GET' }, token);
}

export async function apiCreateProject(
  token: string,
  payload: Partial<Project>
): Promise<{ ok: boolean; project: EnrichedProject; state: ERPState }> {
  return apiFetch(
    '/erp/projects',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function apiUpdateProject(
  token: string,
  projectId: string,
  payload: Partial<Project>
): Promise<{ ok: boolean; project: EnrichedProject; state: ERPState }> {
  return apiFetch(
    `/erp/projects/${encodeURIComponent(projectId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function apiUpdateProjectStatus(
  token: string,
  projectId: string,
  payload: {
    status: ProjectStatus;
    progress?: number;
    actualCompletionDate?: string;
    remarks?: string;
  }
): Promise<{ ok: boolean; project: EnrichedProject; state: ERPState }> {
  return apiFetch(
    `/erp/projects/${encodeURIComponent(projectId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function apiDeleteProject(
  token: string,
  projectId: string
): Promise<{ ok: boolean; state: ERPState }> {
  return apiFetch(
    `/erp/projects/${encodeURIComponent(projectId)}`,
    {
      method: 'DELETE',
    },
    token
  );
}

