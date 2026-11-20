import React, { useState } from 'react';
import { Database, PenTool, Plus, Shield, Trash2, Users } from 'lucide-react';
import { ALL_MODULES, SQL_WAREHOUSE_SCHEMA } from '../../utils/erpConfig';
import { Employee, ERPState, ItemGroup, ModuleId, ProjectType, UserAccount } from '../../types/erp';
import { formatPHP } from '../../utils/formatters';
import { SignaturePadModal } from '../SignaturePadModal';
import { StatusText } from '../StatusText';

interface MasterDataModuleProps {
  state: ERPState;
  currentUser: UserAccount;
  onUpdateState: (updater: (prev: ERPState) => ERPState) => void;
}

type Tab = 'projects' | 'suppliers' | 'materials' | 'employees' | 'users' | 'schema';

export const MasterDataModule: React.FC<MasterDataModuleProps> = ({
  state,
  currentUser,
  onUpdateState,
}) => {
  const [tab, setTab] = useState<Tab>('employees');
  const [sigEmployee, setSigEmployee] = useState<Employee | null>(null);

  // Quick add forms
  const [newProj, setNewProj] = useState({ name: '', type: 'Road' as ProjectType, location: 'Bukidnon', budget: '5000000', manager: 'Engr. Peter Villanueva' });
  const [newSup, setNewSup] = useState({ name: '', contact: '', address: 'Bukidnon', terms: 'Net 30', category: 'Construction' });
  const [newMat, setNewMat] = useState({ name: '', group: 'Construction Materials' as ItemGroup, category: 'Road Materials', unit: 'Bag', standardCost: '300' });
  const [newEmp, setNewEmp] = useState({ name: '', position: '', department: 'Field Operations', email: '' });
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    employeeId: state.employees[0]?.id || '',
    roleLabel: '',
    isAdmin: false,
    allowedModules: ['requisitions'] as ModuleId[],
  });

  const handleSaveSignature = (employeeId: string, dataUrl: string) => {
    onUpdateState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === employeeId ? { ...e, signatureDataUrl: dataUrl || undefined } : e
      ),
    }));
    setSigEmployee(null);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProj.name.trim()) return;
    const id = `proj-${Date.now()}`;
    const code = `PRJ-BKD-${String(state.projects.length + 1).padStart(2, '0')}`;
    onUpdateState((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id,
          code,
          name: newProj.name.trim(),
          type: newProj.type,
          location: newProj.location.trim() || 'Bukidnon',
          budget: Number(newProj.budget) || 0,
          status: 'Active',
          startDate: new Date().toISOString().slice(0, 10),
          manager: newProj.manager,
        },
      ],
    }));
    setNewProj({ ...newProj, name: '' });
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSup.name.trim()) return;
    onUpdateState((prev) => ({
      ...prev,
      suppliers: [
        ...prev.suppliers,
        {
          id: `sup-${Date.now()}`,
          name: newSup.name.trim(),
          contact: newSup.contact.trim() || '0917-000-0000',
          address: newSup.address.trim() || 'Bukidnon',
          terms: newSup.terms,
          category: newSup.category,
          rating: 4.5,
        },
      ],
    }));
    setNewSup({ ...newSup, name: '', contact: '' });
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMat.name.trim()) return;
    const code = `MAT-${String(state.materials.length + 1).padStart(3, '0')}`;
    onUpdateState((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        {
          id: `mat-${Date.now()}`,
          code,
          name: newMat.name.trim(),
          group: newMat.group,
          category: newMat.category,
          unit: newMat.unit,
          standardCost: Number(newMat.standardCost) || 0,
        },
      ],
    }));
    setNewMat({ ...newMat, name: '' });
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name.trim()) return;
    onUpdateState((prev) => ({
      ...prev,
      employees: [
        ...prev.employees,
        {
          id: `emp-${Date.now()}`,
          name: newEmp.name.trim(),
          position: newEmp.position.trim() || 'Staff',
          department: newEmp.department,
          email: newEmp.email.trim() || 'staff@rfbconstruction.ph',
        },
      ],
    }));
    setNewEmp({ name: '', position: '', department: 'Field Operations', email: '' });
  };

  const handleToggleModule = (mod: ModuleId) => {
    setNewUser((prev) => {
      const exists = prev.allowedModules.includes(mod);
      return {
        ...prev,
        allowedModules: exists
          ? prev.allowedModules.filter((m) => m !== mod)
          : [...prev.allowedModules, mod],
      };
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.password.trim()) return;
    if (state.users.some((u) => u.username.toLowerCase() === newUser.username.trim().toLowerCase())) {
      return;
    }
    onUpdateState((prev) => ({
      ...prev,
      users: [
        ...prev.users,
        {
          id: `usr-${Date.now()}`,
          username: newUser.username.trim(),
          password: newUser.password,
          employeeId: newUser.employeeId || prev.employees[0]?.id || '',
          roleLabel: newUser.roleLabel.trim() || 'Staff User',
          isAdmin: newUser.isAdmin,
          allowedModules: newUser.isAdmin ? ALL_MODULES.map((m) => m.id) : newUser.allowedModules,
        },
      ],
    }));
    setNewUser({
      username: '',
      password: '',
      employeeId: state.employees[0]?.id || '',
      roleLabel: '',
      isAdmin: false,
      allowedModules: ['requisitions'],
    });
  };

  const handleDeleteUser = (userId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Master Data &amp; Access Control</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Butuan City &amp; Mindanao project sites, accredited suppliers, items catalog, employee e-signatures, and role-based user accounts.
        </p>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl w-fit">
        {(
          [
            { id: 'employees', label: 'Employees & E-Signatures' },
            { id: 'projects', label: 'Projects' },
            { id: 'suppliers', label: 'Suppliers' },
            { id: 'materials', label: 'Items Catalog' },
            ...(currentUser.isAdmin ? [{ id: 'users', label: 'User Accounts' }] : []),
            { id: 'schema', label: 'SQL DW Schema' },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === t.id
                ? 'bg-white dark:bg-slate-900 text-[#123E82] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Employees & E-Signatures */}
      {tab === 'employees' && (
        <div className="space-y-5">
          <form onSubmit={handleAddEmployee} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={newEmp.name}
                onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                placeholder="e.g. Engr. Marco Dizon"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Position</label>
              <input
                type="text"
                value={newEmp.position}
                onChange={(e) => setNewEmp({ ...newEmp, position: e.target.value })}
                placeholder="Site Engineer"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <input
                type="text"
                value={newEmp.department}
                onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={newEmp.email}
                onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                placeholder="name@rfbconstruction.ph"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Employee
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Employee Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Position</th>
                  <th className="px-4 py-3 text-left font-semibold">Department</th>
                  <th className="px-4 py-3 text-left font-semibold">E-Signature</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{emp.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{emp.position}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{emp.department}</td>
                    <td className="px-4 py-3">
                      {emp.signatureDataUrl ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={emp.signatureDataUrl}
                            alt={`${emp.name} signature`}
                            className="h-8 w-24 object-contain border border-slate-200 dark:border-slate-700 rounded bg-white p-0.5"
                          />
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Captured</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">Not captured yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSigEmployee(emp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#123E82] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        {emp.signatureDataUrl ? 'Edit Signature' : 'Capture Signature'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Projects */}
      {tab === 'projects' && (
        <div className="space-y-5">
          <form onSubmit={handleAddProject} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Name</label>
              <input
                type="text"
                value={newProj.name}
                onChange={(e) => setNewProj({ ...newProj, name: e.target.value })}
                placeholder="e.g. Butuan Bypass Road Expansion"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select
                value={newProj.type}
                onChange={(e) => setNewProj({ ...newProj, type: e.target.value as ProjectType })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Road">Road</option>
                <option value="Bridge">Bridge</option>
                <option value="Building">Building</option>
                <option value="Administrative">Administrative</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Approved Budget (₱)</label>
              <input
                type="number"
                value={newProj.budget}
                onChange={(e) => setNewProj({ ...newProj, budget: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Project
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Project Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Location</th>
                  <th className="px-4 py-3 text-right font-semibold">Budget</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-semibold text-[#123E82] dark:text-blue-300">{p.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.type}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.location}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatPHP(p.budget)}</td>
                    <td className="px-4 py-3"><StatusText status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers */}
      {tab === 'suppliers' && (
        <div className="space-y-5">
          <form onSubmit={handleAddSupplier} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier Name</label>
              <input
                type="text"
                value={newSup.name}
                onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                placeholder="Supplier company name"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact No.</label>
              <input
                type="text"
                value={newSup.contact}
                onChange={(e) => setNewSup({ ...newSup, contact: e.target.value })}
                placeholder="0917-xxx-xxxx"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Terms</label>
              <input
                type="text"
                value={newSup.terms}
                onChange={(e) => setNewSup({ ...newSup, terms: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Supplier
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Supplier</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Address</th>
                  <th className="px-4 py-3 text-left font-semibold">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold">Terms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.category}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.address}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{s.contact}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.terms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Items Catalog */}
      {tab === 'materials' && (
        <div className="space-y-5">
          <form onSubmit={handleAddMaterial} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item / Material Name</label>
              <input
                type="text"
                value={newMat.name}
                onChange={(e) => setNewMat({ ...newMat, name: e.target.value })}
                placeholder="Item description"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Group</label>
              <select
                value={newMat.group}
                onChange={(e) => setNewMat({ ...newMat, group: e.target.value as ItemGroup })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Construction Materials">Construction Materials</option>
                <option value="ICT Equipment">ICT Equipment</option>
                <option value="General Supplies">General Supplies</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit / Std Cost (₱)</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newMat.unit}
                  onChange={(e) => setNewMat({ ...newMat, unit: e.target.value })}
                  placeholder="Unit"
                  className="w-1/2 px-2.5 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <input
                  type="number"
                  value={newMat.standardCost}
                  onChange={(e) => setNewMat({ ...newMat, standardCost: e.target.value })}
                  className="w-1/2 px-2.5 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Item Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Group</th>
                  <th className="px-4 py-3 text-left font-semibold">Unit</th>
                  <th className="px-4 py-3 text-right font-semibold">Standard Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-semibold text-[#123E82] dark:text-blue-300">{m.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{m.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.group}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.unit}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatPHP(m.standardCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin-only User Accounts */}
      {tab === 'users' && currentUser.isAdmin && (
        <div className="space-y-5">
          <form onSubmit={handleCreateUser} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Users className="w-4 h-4 text-[#2C6FE0] dark:text-blue-400" />
              Create Role-Based User Account
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="e.g. elena"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Assign password"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Linked Employee</label>
                <select
                  value={newUser.employeeId}
                  onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {state.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role Label</label>
                <input
                  type="text"
                  value={newUser.roleLabel}
                  onChange={(e) => setNewUser({ ...newUser, roleLabel: e.target.value })}
                  placeholder="e.g. Site Checker"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Module Access</span>
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123E82] dark:text-blue-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUser.isAdmin}
                    onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                    className="accent-[#2C6FE0]"
                  />
                  Grant Full Admin Access
                </label>
              </div>

              {!newUser.isAdmin && (
                <div className="flex flex-wrap gap-2">
                  {ALL_MODULES.map((m) => {
                    const checked = newUser.allowedModules.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border cursor-pointer transition-colors ${
                          checked
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-[#2C6FE0] dark:border-blue-500 text-[#123E82] dark:text-blue-300 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleModule(m.id)}
                          className="accent-[#2C6FE0]"
                        />
                        {m.label}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" /> Create User Account
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Username</th>
                  <th className="px-4 py-3 text-left font-semibold">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-left font-semibold">Allowed Modules</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.users.map((u) => {
                  const emp = state.employees.find((e) => e.id === u.employeeId);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono font-semibold text-[#123E82] dark:text-blue-300">{u.username}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{emp?.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.roleLabel}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {u.isAdmin ? 'All Modules (Admin)' : u.allowedModules.join(', ')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.username !== 'admin' ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SQL Schema Tab */}
      {tab === 'schema' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#123E82] dark:text-blue-300">
            <Database className="w-4 h-4" />
            RFB Construction System — SQL OLTP &amp; Data Warehouse DDL
          </div>
          <pre className="bg-slate-900 dark:bg-slate-950 text-blue-100 border border-slate-800 rounded-xl p-5 text-xs font-mono overflow-x-auto leading-relaxed">
            {SQL_WAREHOUSE_SCHEMA}
          </pre>
        </div>
      )}

      {sigEmployee && (
        <SignaturePadModal
          employee={sigEmployee}
          onClose={() => setSigEmployee(null)}
          onSave={handleSaveSignature}
        />
      )}
    </div>
  );
};
