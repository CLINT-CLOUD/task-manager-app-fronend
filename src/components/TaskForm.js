import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TaskForm.css';
import './Sidebar.css';
import './Alert.css';
import DashboardCharts from './DashboardCharts';
import { LayoutDashboard, PlusCircle, FolderOpen, LogOut, Menu } from 'lucide-react';

const API = process.env.REACT_APP_API_URL;

function UserDashboard() {
  const [form, setForm] = useState({
    email: '',
    title: '',
    description: '',
    priority: 'Medium',
    deadline: '',
  });

  const [assignedTasks, setAssignedTasks] = useState([]);
  const [createdTasks, setCreatedTasks] = useState([]);
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [view, setView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [userName, setUserName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMore, setShowMore] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allTasks = res.data;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;
      const userEmail = payload.email;
      const name = payload.name || 'User';

      setUserName(name);
      const assigned = allTasks.filter(task => task.assignedTo === userEmail);
      const created = allTasks.filter(
        task => task.createdBy?._id === userId && task.assignedTo !== userEmail
      );

      setAssignedTasks(assigned);
      setCreatedTasks(created);
    } catch (err) {
      setAlert({ message: 'Could not load tasks', type: 'error' });
    }
  };

  useEffect(() => {
    fetchTasks();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/tasks`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ email: '', title: '', description: '', priority: 'Medium', deadline: '' });
      setAlert({ message: 'Task created successfully!', type: 'success' });
      fetchTasks();
    } catch (err) {
      setAlert({ message: 'Error creating task', type: 'error' });
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/tasks/${taskId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (newStatus === 'Completed') {
        setAlert({ message: 'Task marked as Completed ✅', type: 'success' });
      }
      fetchTasks();
    } catch (err) {
      setAlert({ message: 'Error updating status', type: 'error' });
    }
  };

  const getCountdown = (deadline, status) => {
    if (!deadline || status === 'Completed') return null;
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - currentTime;
    if (diff <= 0) return '⛔ Overdue';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
  };

  const isOverdue = (deadline, status) => {
    return deadline && new Date(deadline) < currentTime && status !== 'Completed';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const dismissAlert = () => setAlert({ message: '', type: '' });

  const filterTasks = (tasks, status) => {
    return tasks.filter(
      (task) =>
        (statusFilter === 'All' || task.status === statusFilter) &&
        task.status === status &&
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const toggleShowMore = (key) => {
    setShowMore(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderTaskColumn = (tasks, status, columnKey) => {
    const filtered = filterTasks(tasks, status);
    const visibleTasks = showMore[columnKey] ? filtered : filtered.slice(0, 3);

    return (
      <div className="kanban-column" key={status}>
        <h3>{status}</h3>
        {visibleTasks.map((task) => (
          <div
            key={task._id}
            className={`task-card ${task.status.toLowerCase()} ${isOverdue(task.deadline, task.status) ? 'overdue' : ''}`}
          >
            <strong>{task.title}</strong>
            <p>{task.description}</p>
            {task.createdBy && <p><strong>Assigned by:</strong> {task.createdBy.name} ({task.createdBy.email})</p>}
            <em>Priority: {task.priority}</em>
            {task.deadline && task.status !== 'Completed' && (
              <p className="countdown"><strong>Deadline:</strong> {getCountdown(task.deadline, task.status)}</p>
            )}
            <div className="task-actions">
              <label>Update Status:</label>
              <select
                value={task.status}
                onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                disabled={task.status === 'Completed'}
              >
                <option value="Pending">Pending</option>
                <option value="Working">Working</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        ))}
        {filtered.length > 3 && (
          <button className="show-more-btn" onClick={() => toggleShowMore(columnKey)}>
            {showMore[columnKey] ? 'Show Less' : 'Show More'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <Menu size={20} />
      </button>
      <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <h2 className="sidebar-title"><LayoutDashboard size={20} /> TaskManager</h2>
        <button onClick={() => setView('dashboard')}><LayoutDashboard size={16} /> Dashboard</button>
        <button onClick={() => setView('create')}><PlusCircle size={16} /> Create Task</button>
        <button onClick={() => setView('tasks')}><FolderOpen size={16} /> My Tasks</button>
        <button onClick={handleLogout}><LogOut size={16} /> Logout</button>
      </aside>

      <main className="main-content">
        {userName && (
          <div className="bounce-welcome">
            👋 Welcome, <strong>{userName}</strong>
          </div>
        )}

        {alert.message && (
          <div className={`alert-box ${alert.type}`}>
            <span>{alert.message}</span>
            <button className="close-btn" onClick={dismissAlert}>×</button>
          </div>
        )}

        {view === 'dashboard' && (
          <div>
            <h2>User Task Dashboard</h2>
            <DashboardCharts tasks={[...assignedTasks, ...createdTasks]} users={[]} />
          </div>
        )}

        {view === 'create' && (
          <form onSubmit={handleSubmit} className="task-form">
            <h3>Create Task</h3>
            <input type="email" placeholder="Assign to Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <label className="datetime-label">
              Select Due Time:
              <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            </label>
            <button type="submit">Create Task</button>
          </form>
        )}

        {view === 'tasks' && (
          <>
            <div className="task-filters">
              <input type="text" placeholder="Search by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Working">Working</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="kanban-section">
              <h2>My Assigned Tasks</h2>
              <div className="kanban-board">
                {['Pending', 'Working', 'Completed'].map((status) =>
                  renderTaskColumn(assignedTasks, status, `assigned-${status}`)
                )}
              </div>
            </div>

            <div className="kanban-section">
              <h2>My Created Tasks</h2>
              <div className="kanban-board">
                {['Pending', 'Working', 'Completed'].map((status) =>
                  renderTaskColumn(createdTasks, status, `created-${status}`)
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default UserDashboard;
