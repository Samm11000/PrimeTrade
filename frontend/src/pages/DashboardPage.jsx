import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { tasksApi, adminApi } from '../api/axios';
import toast from 'react-hot-toast';
import {
  TrendingUp, LogOut, Plus, Edit2, Trash2, X, CheckCircle,
  Clock, AlertCircle, Shield, Users, BarChart2, Loader
} from 'lucide-react';

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ user, onLogout }) => (
  <nav className="navbar">
    <div className="navbar-brand">
      <div className="navbar-brand-icon">
        <TrendingUp size={20} color="white" />
      </div>
      PrimeTrade
    </div>
    <div className="navbar-right">
      <div className="navbar-user">
        <div className="navbar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <span className="navbar-username">{user?.name}</span>
        <span className={`role-badge ${user?.role === 'admin' ? 'role-badge-admin' : 'role-badge-user'}`}>
          {user?.role}
        </span>
      </div>
      <button id="logout-btn" className="btn btn-secondary btn-sm" onClick={onLogout}>
        <LogOut size={14} /> Logout
      </button>
    </div>
  </nav>
);

// ─── Task Modal ───────────────────────────────────────────────────────────────
const TaskModal = ({ task, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.dueDate) {
        payload.dueDate = new Date(payload.dueDate).toISOString();
      } else {
        delete payload.dueDate;
      }
      if (task) {
        await tasksApi.update(task._id, payload);
        toast.success('Task updated!');
      } else {
        await tasksApi.create(payload);
        toast.success('Task created!');
      }
      onSave();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const fieldErrors = {};
        data.errors.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      } else {
        toast.error(data?.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit Task' : 'New Task'}</h2>
          <button id="modal-close-btn" className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="task-title">Title *</label>
            <input id="task-title" name="title" className="form-input" placeholder="Task title"
              value={form.title} onChange={handleChange} required />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">Description</label>
            <textarea id="task-desc" name="description" className="form-input" placeholder="Optional details..."
              value={form.description} onChange={handleChange} rows={3}
              style={{ resize: 'vertical', minHeight: '80px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="task-status">Status</label>
              <select id="task-status" name="status" className="form-select" value={form.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="task-priority">Priority</label>
              <select id="task-priority" name="priority" className="form-select" value={form.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="task-due">Due Date</label>
            <input id="task-due" name="dueDate" type="date" className="form-input"
              value={form.dueDate} onChange={handleChange} />
          </div>
          <div className="modal-actions">
            <button id="modal-cancel-btn" type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="modal-save-btn" type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={loading}>
              {loading ? <Loader size={14} /> : null}
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Badge helpers ────────────────────────────────────────────────────────────
const statusIcon = { pending: <Clock size={12} />, 'in-progress': <AlertCircle size={12} />, completed: <CheckCircle size={12} /> };

// ─── Dashboard Page ───────────────────────────────────────────────────────────
const DashboardPage = () => {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '' });

  const isAdmin = user?.role === 'admin';

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const res = await tasksApi.getAll(params);
      setTasks(res.data.data.tasks);
    } catch {
      toast.error('Failed to load tasks.');
    }
  }, [filters]);

  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [statsRes, usersRes] = await Promise.all([adminApi.getStats(), adminApi.getUsers()]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data.users);
    } catch {
      toast.error('Failed to load admin data.');
    }
  }, [isAdmin]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchAdminData()]);
      setLoading(false);
    };
    load();
  }, [fetchTasks, fetchAdminData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out.');
    navigate('/login');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(id);
      toast.success('Task deleted.');
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their tasks?')) return;
    try {
      await adminApi.deleteUser(id);
      toast.success('User deleted.');
      fetchAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const openCreate = () => { setEditingTask(null); setModalOpen(true); };
  const openEdit = (task) => { setEditingTask(task); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingTask(null); };

  // Stats for the current user
  const myStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="app-wrapper">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="loading-screen">
          <div className="spinner" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            {isAdmin ? '⚡ Admin Dashboard' : `Good day, ${user.name?.split(' ')[0]} 👋`}
          </h1>
          <p className="dashboard-subtitle">
            {isAdmin ? 'Full platform access — manage users and all tasks.' : 'Manage your tasks and stay productive.'}
          </p>
        </div>

        {/* Admin Banner */}
        {isAdmin && (
          <div className="admin-banner">
            <Shield size={18} color="var(--warning)" />
            <span className="admin-banner-text">
              You have admin privileges. You can view and manage all users and tasks on the platform.
            </span>
          </div>
        )}

        {/* Tabs (admin only) */}
        {isAdmin && (
          <div className="tabs">
            <button id="tab-tasks" className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
              Tasks
            </button>
            <button id="tab-users" className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
              <Users size={14} style={{ display: 'inline', marginRight: 4 }} />
              Users ({stats?.totalUsers ?? 0})
            </button>
            <button id="tab-stats" className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
              <BarChart2 size={14} style={{ display: 'inline', marginRight: 4 }} />
              Stats
            </button>
          </div>
        )}

        {/* Stats Row */}
        {activeTab === 'tasks' && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <CheckCircle size={20} color="var(--accent-primary)" />
              </div>
              <div className="stat-label">Total Tasks</div>
              <div className="stat-value">{myStats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
                <Clock size={20} color="var(--warning)" />
              </div>
              <div className="stat-label">Pending</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{myStats.pending}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <AlertCircle size={20} color="var(--info)" />
              </div>
              <div className="stat-label">In Progress</div>
              <div className="stat-value" style={{ color: 'var(--info)' }}>{myStats.inProgress}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <CheckCircle size={20} color="var(--success)" />
              </div>
              <div className="stat-label">Completed</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{myStats.completed}</div>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <>
            <div className="section-header">
              <h2 className="section-title">
                {isAdmin ? 'All Tasks' : 'My Tasks'}
              </h2>
              <button id="create-task-btn" className="btn btn-primary" style={{ width: 'auto' }} onClick={openCreate}>
                <Plus size={16} /> New Task
              </button>
            </div>

            <div className="filter-row">
              <select id="filter-status" className="filter-select" value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select id="filter-priority" className="filter-select" value={filters.priority}
                onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}>
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3 className="empty-state-title">No tasks yet</h3>
                <p className="empty-state-text">Create your first task to get started.</p>
                <button id="empty-create-btn" className="btn btn-primary" style={{ width: 'auto', margin: '0 auto' }} onClick={openCreate}>
                  <Plus size={16} /> Create Task
                </button>
              </div>
            ) : (
              <div className="tasks-grid">
                {tasks.map((task) => (
                  <div key={task._id} className="task-card">
                    <div className="task-card-header">
                      <h3 className="task-title">{task.title}</h3>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    </div>
                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}
                    <div className="task-meta">
                      <span className={`badge badge-${task.status}`}>
                        {statusIcon[task.status]} {task.status}
                      </span>
                      {task.dueDate && (
                        <span className="badge badge-low">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="task-actions">
                      <button id={`edit-task-${task._id}`} className="btn btn-secondary btn-sm" onClick={() => openEdit(task)}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button id={`delete-task-${task._id}`} className="btn btn-danger btn-sm" onClick={() => handleDelete(task._id)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                    {isAdmin && task.owner && (
                      <div className="task-owner">
                        👤 {task.owner.name} ({task.owner.email})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* USERS TAB (admin only) */}
        {activeTab === 'users' && isAdmin && (
          <>
            <div className="section-header">
              <h2 className="section-title">Registered Users</h2>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role === 'admin' ? 'role-badge-admin' : 'role-badge-user'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        {u._id !== user._id && (
                          <button id={`delete-user-${u._id}`} className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(u._id)}>
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* STATS TAB (admin only) */}
        {activeTab === 'stats' && isAdmin && stats && (
          <>
            <div className="section-header">
              <h2 className="section-title">Platform Statistics</h2>
            </div>
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-label">Total Users</div>
                <div className="stat-value">{stats.totalUsers}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Tasks</div>
                <div className="stat-value">{stats.totalTasks}</div>
              </div>
            </div>
            <div className="section-header" style={{ marginTop: 8 }}>
              <h3 className="section-title" style={{ fontSize: 16 }}>Tasks by Status</h3>
            </div>
            <div className="stats-grid">
              {stats.tasksByStatus.map((s) => (
                <div key={s._id} className="stat-card">
                  <div className="stat-label">{s._id}</div>
                  <div className="stat-value">{s.count}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <TaskModal task={editingTask} onClose={closeModal} onSave={fetchTasks} />
      )}
    </div>
  );
};

export default DashboardPage;
