import { useState, useEffect } from 'react';
import {
  FiUsers,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiUserCheck,
  FiUserX,
  FiRefreshCw,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedRole) params.role = selectedRole;
      if (search.trim()) params.search = search.trim();

      const data = await adminService.getUsers(params);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users', err);
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = !user.active;
    try {
      await adminService.updateUserStatus(user.id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: nextStatus } : u))
      );
      toast.success(
        `User ${user.email} is now ${nextStatus ? 'Active' : 'Suspended'}.`
      );
    } catch (err) {
      toast.error('Failed to update user status.');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 text-[11px] font-bold">
            <FiShield size={11} /> Admin
          </span>
        );
      case 'PHARMACY_OWNER':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2.5 py-0.5 text-[11px] font-bold">
            Pharmacy Owner
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold">
            Customer
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-white">
      {/* Header */}
      <section className="relative rounded-4xl border border-white/15 bg-white/10 p-7 sm:p-9 shadow-2xl backdrop-blur-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md mb-3 shadow-lg shadow-cyan-900/30">
              <FiUsers size={14} /> User Administration
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Registered Accounts
            </h1>
            <p className="mt-1 text-sm text-primary-100/80">
              Search, review, and manage patient, pharmacy owner, and admin accounts.
            </p>
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" size={17} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by full name or email..."
            className="w-full rounded-2xl border border-white/20 bg-slate-900/70 pl-11 pr-24 py-3 text-sm text-white placeholder:text-primary-200/50 backdrop-blur-xl focus:border-cyan-400 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-4 text-xs font-bold"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['', 'USER', 'PHARMACY_OWNER', 'ADMIN'].map((role) => (
            <button
              key={role || 'ALL'}
              onClick={() => setSelectedRole(role)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                selectedRole === role
                  ? 'bg-cyan-500 text-primary-950 shadow-md shadow-cyan-500/30'
                  : 'border border-white/15 bg-white/5 text-primary-100 hover:bg-white/10'
              }`}
            >
              {role ? role.replace('_', ' ') : 'All Roles'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Phone</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Email Verified</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-primary-200 animate-pulse">
                    Loading registered user accounts...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-primary-600 font-bold text-white text-xs">
                          {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{u.fullName}</p>
                          <p className="text-[11px] text-primary-200/70">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-primary-100">{u.phone || '—'}</td>
                    <td className="px-5 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-5 py-4">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                          <FiCheckCircle size={13} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-xs">
                          <FiXCircle size={13} /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {u.emailVerified ? (
                        <span className="text-cyan-400 font-semibold text-xs">Yes</span>
                      ) : (
                        <span className="text-primary-300/60 text-xs">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                          u.active
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30 hover:bg-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30'
                        }`}
                      >
                        {u.active ? (
                          <>
                            <FiUserX size={13} /> Suspend
                          </>
                        ) : (
                          <>
                            <FiUserCheck size={13} /> Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-primary-200/70">
                    No users matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
