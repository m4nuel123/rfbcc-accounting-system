import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FolderKanban,
  PauseCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  Company,
  Employee,
  ERPState,
  PermissionId,
  Project,
  ProjectStatus,
  ProjectType,
  SafeUserAccount,
  UserCompanyAccess,
} from '../../types/erp';
import {
  apiCreateProject,
  apiDeleteProject,
  apiFetchProjects,
  apiUpdateProject,
  apiUpdateProjectStatus,
  EnrichedProject,
} from '../../utils/apiClient';
import { formatCompactPHP, formatPHP, todayISO } from '../../utils/formatters';
import { StatusText } from '../StatusText';

interface ProjectManagementModuleProps {
  state: ERPState;
  authToken: string;
  currentUser: SafeUserAccount;
  activeCompany: Company;
  activeAccess: UserCompanyAccess;
  currentEmployee: Employee;
  can: (perm: PermissionId) => boolean;
  onSyncServerState: (nextState: ERPState) => void;
}

const PROJECT_STATUSES: ProjectStatus[] = [
  'Planning',
  'Not Yet Started',
  'Ongoing',
  'On Hold',
  'Completed',
  'Cancelled',
];

const PROJECT_TYPES: ProjectType[] = ['Road', 'Bridge', 'Building', 'Administrative'];

type SortField = 'code' | 'name' | 'startDate' | 'targetCompletionDate' | 'progress' | 'status';
type QuickTab = 'all' | 'ongoing' | 'completed' | 'overdue';

function isManagement(user: SafeUserAccount, access: UserCompanyAccess): boolean {
  if (user.isAdmin) return true;
  const labels = `${user.position || ''} ${user.roleLabel || ''} ${access.roleLabel || ''}`;
  return /(head|vice president|\bvp\b|administrator)/i.test(labels);
}

export const ProjectManagementModule: React.FC<ProjectManagementModuleProps> = ({
  state,
  authToken,
  currentUser,
  activeCompany,
  activeAccess,
  currentEmployee,
  can,
  onSyncServerState,
}) => {
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [assignedCompanies, setAssignedCompanies] = useState<Company[]>([activeCompany]);
  const [isConsolidatedAvailable, setIsConsolidatedAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Sorting
  const [quickTab, setQuickTab] = useState<QuickTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('startDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<EnrichedProject | null>(null);
  const [viewProject, setViewProject] = useState<EnrichedProject | null>(null);
  const [statusProject, setStatusProject] = useState<EnrichedProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedProject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Draft
  const [form, setForm] = useState<{
    companyId: string;
    code: string;
    name: string;
    type: ProjectType;
    location: string;
    clientOwner: string;
    description: string;
    manager: string;
    startDate: string;
    targetCompletionDate: string;
    actualCompletionDate: string;
    budget: string;
    status: ProjectStatus;
    progress: number;
    remarks: string;
  }>({
    companyId: activeCompany.id,
    code: '',
    name: '',
    type: 'Road',
    location: activeCompany.address,
    clientOwner: '',
    description: '',
    manager: currentEmployee.name,
    startDate: todayISO(),
    targetCompletionDate: '',
    actualCompletionDate: '',
    budget: '5000000',
    status: 'Planning',
    progress: 0,
    remarks: '',
  });

  // Status Update Modal Draft
  const [statusDraft, setStatusDraft] = useState<{
    status: ProjectStatus;
    progress: number;
    actualCompletionDate: string;
    remarks: string;
  }>({
    status: 'Ongoing',
    progress: 0,
    actualCompletionDate: '',
    remarks: '',
  });

  const canCreate = can('create_transactions');
  const canEdit = can('edit_transactions');
  const canUpdateStatus =
    can('edit_transactions') || can('process_transactions') || can('approve_transactions');
  const canDelete = can('delete_transactions');
  const isMgmt = useMemo(() => isManagement(currentUser, activeAccess), [currentUser, activeAccess]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetchProjects(authToken, 'consolidated');
      setProjects(res.projects);
      setAssignedCompanies(res.assignedCompanies);
      setIsConsolidatedAvailable(res.isConsolidatedAvailable);
      if (!res.isConsolidatedAvailable) {
        setCompanyFilter(activeCompany.id);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to load project registry.');
    } finally {
      setLoading(false);
    }
  }, [authToken, activeCompany.id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects, activeCompany.id]);

  const metrics = useMemo(() => {
    const scopeList =
      companyFilter === 'ALL'
        ? projects
        : projects.filter((p) => p.companyId === companyFilter);

    const total = scopeList.length;
    const ongoing = scopeList.filter((p) => p.status === 'Ongoing').length;
    const completed = scopeList.filter((p) => p.status === 'Completed').length;
    const notYetStarted = scopeList.filter((p) => p.status === 'Not Yet Started').length;
    const planning = scopeList.filter((p) => p.status === 'Planning').length;
    const onHold = scopeList.filter((p) => p.status === 'On Hold').length;
    const delayed = scopeList.filter((p) => p.isOverdue).length;
    const totalBudget = scopeList.reduce((sum, p) => sum + p.budget, 0);
    const totalActual = scopeList.reduce((sum, p) => sum + p.actualSpend, 0);

    return {
      total,
      ongoing,
      completed,
      notYetStarted,
      planning,
      onHold,
      delayed,
      totalBudget,
      totalActual,
    };
  }, [projects, companyFilter]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = projects.filter((p) => {
      if (companyFilter !== 'ALL' && p.companyId !== companyFilter) return false;

      if (quickTab === 'ongoing' && p.status !== 'Ongoing') return false;
      if (quickTab === 'completed' && p.status !== 'Completed') return false;
      if (quickTab === 'overdue' && !p.isOverdue) return false;

      if (statusFilter === 'OVERDUE') {
        if (!p.isOverdue) return false;
      } else if (statusFilter !== 'ALL' && p.status !== statusFilter) {
        return false;
      }

      if (dateFrom && p.startDate < dateFrom) return false;
      if (dateTo && p.targetCompletionDate > dateTo) return false;

      if (q) {
        const hay =
          `${p.code} ${p.name} ${p.location} ${p.clientOwner} ${p.manager} ${p.companyCode} ${p.companyName} ${p.type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'progress') {
        cmp = a.progress - b.progress;
      } else {
        cmp = String(a[sortBy] || '').localeCompare(String(b[sortBy] || ''));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [projects, companyFilter, quickTab, statusFilter, dateFrom, dateTo, searchQuery, sortBy, sortDir]);

  const openAddModal = () => {
    setEditingProject(null);
    setFormError('');
    const targetCompId =
      companyFilter !== 'ALL' && assignedCompanies.some((c) => c.id === companyFilter)
        ? companyFilter
        : activeCompany.id;
    const comp = assignedCompanies.find((c) => c.id === targetCompId) || activeCompany;
    const countForComp = projects.filter((p) => p.companyId === comp.id).length + 1;
    const nextYear = `${new Date().getFullYear() + 1}-06-30`;

    setForm({
      companyId: comp.id,
      code: `${comp.code}-PRJ-${String(countForComp).padStart(2, '0')}`,
      name: '',
      type: 'Road',
      location: comp.address,
      clientOwner: '',
      description: '',
      manager: state.employees[0]?.name || currentEmployee.name,
      startDate: todayISO(),
      targetCompletionDate: nextYear,
      actualCompletionDate: '',
      budget: '5000000',
      status: 'Planning',
      progress: 0,
      remarks: '',
    });
    setFormOpen(true);
  };

  const openEditModal = (p: EnrichedProject) => {
    setEditingProject(p);
    setFormError('');
    setForm({
      companyId: p.companyId,
      code: p.code,
      name: p.name,
      type: p.type,
      location: p.location,
      clientOwner: p.clientOwner,
      description: p.description,
      manager: p.manager,
      startDate: p.startDate,
      targetCompletionDate: p.targetCompletionDate,
      actualCompletionDate: p.actualCompletionDate || '',
      budget: String(p.budget),
      status: p.status,
      progress: p.progress,
      remarks: p.remarks || '',
    });
    setFormOpen(true);
  };

  const openStatusModal = (p: EnrichedProject) => {
    setStatusProject(p);
    setFormError('');
    setStatusDraft({
      status: p.status,
      progress: p.progress,
      actualCompletionDate: p.actualCompletionDate || '',
      remarks: p.remarks || '',
    });
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();
    if (!code || !name || !form.location.trim() || !form.manager.trim() || !form.startDate || !form.targetCompletionDate) {
      setFormError('Please fill in all required project details.');
      return;
    }

    const dup = projects.find(
      (p) =>
        p.companyId === form.companyId &&
        p.code.trim().toUpperCase() === code &&
        p.id !== editingProject?.id
    );
    if (dup) {
      const compCode = assignedCompanies.find((c) => c.id === form.companyId)?.code || activeCompany.code;
      setFormError(`Duplicate Project Code: "${code}" already exists in ${compCode}.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Project> = {
        companyId: form.companyId,
        code,
        name,
        type: form.type,
        location: form.location.trim(),
        clientOwner: form.clientOwner.trim(),
        description: form.description.trim(),
        manager: form.manager.trim(),
        startDate: form.startDate,
        targetCompletionDate: form.targetCompletionDate,
        actualCompletionDate: form.actualCompletionDate || undefined,
        budget: Number(form.budget) || 0,
        status: form.status,
        progress: form.status === 'Completed' ? 100 : form.progress,
        remarks: form.remarks.trim(),
      };

      const res = editingProject
        ? await apiUpdateProject(authToken, editingProject.id, payload)
        : await apiCreateProject(authToken, payload);

      onSyncServerState(res.state);
      await loadProjects();
      setFormOpen(false);
      setBanner({
        type: 'success',
        text: editingProject
          ? `Updated project ${res.project.code} (${res.project.name}).`
          : `Registered new project ${res.project.code} (${res.project.name}) under ${res.project.companyCode}.`,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusProject) return;
    setFormError('');
    setSubmitting(true);
    try {
      const res = await apiUpdateProjectStatus(authToken, statusProject.id, {
        status: statusDraft.status,
        progress: statusDraft.status === 'Completed' ? 100 : statusDraft.progress,
        actualCompletionDate: statusDraft.actualCompletionDate || undefined,
        remarks: statusDraft.remarks.trim(),
      });
      onSyncServerState(res.state);
      await loadProjects();
      setStatusProject(null);
      setBanner({
        type: 'success',
        text: `Updated ${res.project.code} status to ${res.project.status} (${res.project.progress}% complete).`,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to update project status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const res = await apiDeleteProject(authToken, deleteTarget.id);
      onSyncServerState(res.state);
      await loadProjects();
      setBanner({
        type: 'success',
        text: `Deleted project ${deleteTarget.code} — ${deleteTarget.name}.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      setBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to delete project.',
      });
      setDeleteTarget(null);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Project Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isConsolidatedAvailable
              ? 'Unified RFB & RBI project portfolio registry, progress tracking, and automatic schedule monitoring.'
              : `${activeCompany.name} (${activeCompany.code}) project registry, schedule monitoring, and budget tracking.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadProjects}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold brand-btn-primary rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Project
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 text-xs font-medium ${
            banner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          <span>{banner.text}</span>
          <button type="button" onClick={() => setBanner(null)} className="p-1 rounded hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Portfolio Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Projects</span>
            <FolderKanban className="w-4 h-4 brand-text-accent" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
            {formatCompactPHP(metrics.totalBudget)} budget
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Ongoing</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="font-display text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1.5 tabular-nums">
            {metrics.ongoing}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active execution
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1.5 tabular-nums">
            {metrics.completed}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Turned over
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Not Yet Started</span>
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
            {metrics.notYetStarted}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            +{metrics.planning} in Planning
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>On Hold</span>
            <PauseCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="font-display text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1.5 tabular-nums">
            {metrics.onHold}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Pending resumption
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Delayed / Overdue</span>
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="font-display text-2xl font-bold text-red-700 dark:text-red-400 mt-1.5 tabular-nums">
            {metrics.delayed}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Past target date
          </div>
        </div>
      </div>

      {/* Filters & Quick View Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl w-fit">
            {(
              [
                { id: 'all', label: `All Projects (${metrics.total})` },
                { id: 'ongoing', label: `Ongoing (${metrics.ongoing})` },
                { id: 'completed', label: `Completed (${metrics.completed})` },
                { id: 'overdue', label: `Delayed / Overdue (${metrics.delayed})` },
              ] as { id: QuickTab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setQuickTab(t.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  quickTab === t.id
                    ? 'bg-white dark:bg-slate-900 brand-text-primary shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isMgmt && isConsolidatedAvailable && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Building2 className="w-3.5 h-3.5 brand-text-accent" />
              <span>Consolidated RFB + RBI Management View</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, name, location, client, manager..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div>
            <select
              value={companyFilter}
              disabled={!isConsolidatedAvailable}
              onChange={(e) => setCompanyFilter(e.target.value)}
              aria-label="Filter by Company"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-75"
            >
              {isConsolidatedAvailable && <option value="ALL">All Assigned Companies (RFB + RBI)</option>}
              {assignedCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="ALL">All Statuses</option>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="OVERDUE">Delayed / Overdue Only</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="Start date from"
              title="Start date from"
              className="w-full px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="Target completion date to"
              title="Target completion date to"
              className="w-full px-2.5 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="flex gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              aria-label="Sort projects by"
              className="flex-1 px-2.5 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <option value="startDate">Sort: Start Date</option>
              <option value="targetCompletionDate">Sort: Target Date</option>
              <option value="code">Sort: Project Code</option>
              <option value="name">Sort: Project Name</option>
              <option value="progress">Sort: Progress %</option>
              <option value="status">Sort: Status</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              title={`Direction: ${sortDir.toUpperCase()}`}
              className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {(dateFrom || dateTo || searchQuery || statusFilter !== 'ALL' || quickTab !== 'all') && (
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>
              Showing <strong className="text-slate-900 dark:text-slate-100">{filteredProjects.length}</strong> of {projects.length} projects
            </span>
            <button
              type="button"
              onClick={() => {
                setQuickTab('all');
                setSearchQuery('');
                setStatusFilter('ALL');
                setDateFrom('');
                setDateTo('');
                if (isConsolidatedAvailable) setCompanyFilter('ALL');
              }}
              className="brand-text-accent font-semibold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Projects Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
        <table className="w-full text-xs min-w-[1060px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                <button type="button" onClick={() => toggleSort('code')} className="hover:underline cursor-pointer">
                  Project Code
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                <button type="button" onClick={() => toggleSort('name')} className="hover:underline cursor-pointer">
                  Project Name &amp; Client
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">Company</th>
              <th className="px-4 py-3 text-left font-semibold">Location</th>
              <th className="px-4 py-3 text-left font-semibold">Project Manager</th>
              <th className="px-4 py-3 text-left font-semibold">
                <button type="button" onClick={() => toggleSort('startDate')} className="hover:underline cursor-pointer">
                  Start Date
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort('targetCompletionDate')}
                  className="hover:underline cursor-pointer"
                >
                  Target Date
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">Status &amp; Schedule</th>
              <th className="px-4 py-3 text-left font-semibold w-36">
                <button type="button" onClick={() => toggleSort('progress')} className="hover:underline cursor-pointer">
                  Progress
                </button>
              </th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  Loading projects...
                </td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  No projects match your selected filters.
                </td>
              </tr>
            ) : (
              filteredProjects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-bold brand-text-primary whitespace-nowrap">{p.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {p.clientOwner} · {p.type} · {formatPHP(p.budget)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                        p.companyCode === 'RBI'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                      }`}
                    >
                      {p.companyCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate" title={p.location}>
                    {p.location}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200 whitespace-nowrap">{p.manager}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.startDate}</td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {p.targetCompletionDate}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <StatusText status={p.status} />
                      {p.isOverdue && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-1.5 py-0.5 rounded w-fit whitespace-nowrap">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          Delayed / Overdue ({p.daysOverdue}d)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p.status === 'Completed'
                              ? 'bg-emerald-600'
                              : p.isOverdue
                                ? 'bg-red-600'
                                : p.status === 'On Hold'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-600'
                          }`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="font-mono font-semibold text-[11px] tabular-nums w-9 text-right text-slate-800 dark:text-slate-200">
                        {p.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setViewProject(p)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="View Project Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Edit Project Information"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canUpdateStatus && (
                        <button
                          type="button"
                          onClick={() => openStatusModal(p)}
                          className="px-2 py-1 text-[11px] font-semibold brand-soft-surface hover:opacity-90 rounded-lg cursor-pointer"
                          title="Update Project Status & Progress"
                        >
                          Status
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Project Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingProject ? `Edit Project · ${editingProject.code}` : 'Register New Project'}
              </h2>
              <button type="button" onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company *</label>
                  <select
                    value={form.companyId}
                    disabled={!isConsolidatedAvailable || Boolean(editingProject)}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-75"
                  >
                    {assignedCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Project Code / Ref No. *
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. RFB-PRJ-05"
                    required
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as ProjectType })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {PROJECT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Butuan Bypass Road Phase II"
                    required
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client / Project Owner *
                  </label>
                  <input
                    type="text"
                    value={form.clientOwner}
                    onChange={(e) => setForm({ ...form, clientOwner: e.target.value })}
                    placeholder="e.g. DPWH Region XIII"
                    required
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Project Location *
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Project Manager / In-Charge *
                  </label>
                  <input
                    type="text"
                    value={form.manager}
                    onChange={(e) => setForm({ ...form, manager: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Scope of civil works, milestones, and deliverables..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Completion Date *
                  </label>
                  <input
                    type="date"
                    value={form.targetCompletionDate}
                    onChange={(e) => setForm({ ...form, targetCompletionDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Completion Date
                  </label>
                  <input
                    type="date"
                    value={form.actualCompletionDate}
                    onChange={(e) => setForm({ ...form, actualCompletionDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Approved Budget (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Project Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as ProjectStatus;
                      setForm({
                        ...form,
                        status: nextStatus,
                        progress: nextStatus === 'Completed' ? 100 : form.progress,
                        actualCompletionDate:
                          nextStatus === 'Completed' && !form.actualCompletionDate
                            ? todayISO()
                            : form.actualCompletionDate,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Completion Progress ({form.status === 'Completed' ? 100 : form.progress}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.status === 'Completed' ? 100 : form.progress}
                    disabled={form.status === 'Completed'}
                    onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                    className="w-full mt-2 accent-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Additional Information
                </label>
                <input
                  type="text"
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Notes on permits, site conditions, or milestones..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold brand-btn-primary rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingProject ? 'Save Changes' : 'Register Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Project Details Modal */}
      {viewProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold brand-text-accent">
                  {viewProject.companyCode} · {viewProject.code}
                </span>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                  {viewProject.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewProject(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <StatusText status={viewProject.status} />
                {viewProject.isOverdue && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-md">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Delayed / Overdue ({viewProject.daysOverdue} days past target)
                  </span>
                )}
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200 ml-auto tabular-nums">
                  {viewProject.progress}% Complete
                </span>
              </div>

              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    viewProject.status === 'Completed'
                      ? 'bg-emerald-600'
                      : viewProject.isOverdue
                        ? 'bg-red-600'
                        : 'bg-blue-600'
                  }`}
                  style={{ width: `${viewProject.progress}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Company</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {viewProject.companyName} ({viewProject.companyCode})
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Client / Project Owner</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{viewProject.clientOwner}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Location</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{viewProject.location}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Project Manager</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{viewProject.manager}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Start Date</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{viewProject.startDate}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Target Completion Date</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {viewProject.targetCompletionDate}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Actual Completion Date</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {viewProject.actualCompletionDate || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Approved Budget / Actual PO Spend</div>
                  <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                    {formatPHP(viewProject.budget)} / {formatPHP(viewProject.actualSpend)}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Description</div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{viewProject.description}</p>
              </div>

              {viewProject.remarks && (
                <div>
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks / Additional Information</div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{viewProject.remarks}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                {canUpdateStatus && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewProject;
                      setViewProject(null);
                      openStatusModal(target);
                    }}
                    className="px-4 py-2 text-xs font-semibold brand-soft-surface rounded-xl cursor-pointer"
                  >
                    Update Status / Progress
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewProject(null)}
                  className="px-4 py-2 text-xs font-semibold brand-btn-primary rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Update Status & Progress Modal */}
      {statusProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Update Status · {statusProject.code}
              </h2>
              <button
                type="button"
                onClick={() => setStatusProject(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveStatusUpdate} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Status</label>
                <select
                  value={statusDraft.status}
                  onChange={(e) => {
                    const next = e.target.value as ProjectStatus;
                    setStatusDraft({
                      ...statusDraft,
                      status: next,
                      progress: next === 'Completed' ? 100 : statusDraft.progress,
                      actualCompletionDate:
                        next === 'Completed' && !statusDraft.actualCompletionDate
                          ? todayISO()
                          : statusDraft.actualCompletionDate,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Completion Progress ({statusDraft.status === 'Completed' ? 100 : statusDraft.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={statusDraft.status === 'Completed'}
                  value={statusDraft.status === 'Completed' ? 100 : statusDraft.progress}
                  onChange={(e) => setStatusDraft({ ...statusDraft, progress: Number(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Actual Completion Date
                </label>
                <input
                  type="date"
                  value={statusDraft.actualCompletionDate}
                  onChange={(e) => setStatusDraft({ ...statusDraft, actualCompletionDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={statusDraft.remarks}
                  onChange={(e) => setStatusDraft({ ...statusDraft, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusProject(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold brand-btn-primary rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Confirm Delete Project
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to remove <strong>{deleteTarget.code} — {deleteTarget.name}</strong> ({deleteTarget.companyCode})? Projects with linked requisitions, POs, or vouchers cannot be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
