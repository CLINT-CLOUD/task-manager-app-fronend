import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './AdminDashboard.css';
import DashboardCharts from './DashboardCharts';

const API = process.env.REACT_APP_API_URL;

function AdminDashboard({ onLogout }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [editTask, setEditTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStatuses, setExpandedStatuses] = useState({});
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: '', type: '' }), 3000);
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/api/tasks/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (Array.isArray(res.data)) {
        setTasks(res.data);
      } else {
        console.error('Tasks data is not an array:', res.data);
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        console.error('Users data is not an array:', res.data);
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleUserCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/api/auth/create-user`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('User created successfully', 'success');
      setForm({ name: '', email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      showAlert('Error creating user', 'error');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTasks(tasks.filter((task) => task._id !== taskId));
      showAlert('Task deleted successfully', 'success');
    } catch (err) {
      showAlert('Error deleting task', 'error');
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API}/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setUsers(users.filter((u) => u._id !== userId));
        showAlert('User deleted successfully', 'success');
      } catch (err) {
        showAlert('Error deleting user', 'error');
      }
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedTask = {
        title: editTask.title?.trim(),
        description: editTask.description?.trim(),
        status: editTask.status?.toUpperCase()?.trim(),
        priority: editTask.priority,
        assignedTo: editTask.assignedTo?.trim(),
      };

      await axios.put(`${API}/api/tasks/${editTask._id}`, updatedTask, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      showAlert('Task updated successfully', 'success');
      setEditTask(null);
      fetchTasks();
    } catch (err) {
      console.error('Error updating task:', err);
      showAlert('Failed to update task', 'error');
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(tasks);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'Task_Report.xlsx');
  };

  const groupedTasks = {
    TODO: [],
    'IN WORK': [],
    'IN PROGRESS': [],
    COMPLETED: [],
  };

  tasks.forEach((task) => {
    const rawStatus = task.status || '';
    const status = rawStatus.toUpperCase().trim();
    if (groupedTasks[status]) {
      groupedTasks[status].push(task);
    } else {
      groupedTasks['TODO'].push(task);
    }
  });

  return (
    <div className={`admin-dashboard ${sidebarOpen ? '' : 'collapsed'}`}>
      <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

      <aside className={`sidebar ${sidebarOpen ? '' : 'hidden'}`}>
        <h2>Admin Panel</h2>
        <button onClick={() => setActiveSection('dashboard')}>Dashboard</button>
        <button onClick={() => setActiveSection('users')}>Users</button>
        <button onClick={() => setActiveSection('tasks')}>Tasks</button>
        <button onClick={onLogout}>Logout</button>
      </aside>

      <main className="main-content">
        {alert.message && (
          <div className={`custom-alert ${alert.type}`}>{alert.message}</div>
        )}

        {activeSection === 'dashboard' && (
          <>
            <h2>Welcome to the Admin Dashboard</h2>
            <DashboardCharts tasks={tasks} users={users} />
          </>
        )}

        {activeSection === 'users' && (
          <>
            <h3>Create New User</h3>
            <form onSubmit={handleUserCreate} className="user-form">
              <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit">Create User</button>
            </form>

            <h3>All Users</h3>
            <input
              type="text"
              className="user-search-input"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            />

            <div className="user-list">
              {users
                .filter(
                  (u) =>
                    u.name.toLowerCase().includes(searchTerm) ||
                    u.email.toLowerCase().includes(searchTerm)
                )
                .map((user) => (
                  <div key={user._id} className="user-card">
                    <h4>{user.name}</h4>
                    <p>{user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                    <button onClick={() => deleteUser(user._id)} className="delete-button">Delete</button>
                  </div>
                ))}
            </div>
          </>
        )}

        {activeSection === 'tasks' && (
          <>
            <div className="task-header">
              <h3>All Tasks</h3>
              <button onClick={exportToExcel} className="export-button">Export to Excel</button>
            </div>

            <div className="kanban-container">
              <div className="kanban-board">
                {Object.keys(groupedTasks).map((status) => {
                  const tasksForStatus = groupedTasks[status];
                  const isExpanded = expandedStatuses[status] || false;
                  const displayedTasks = isExpanded ? tasksForStatus : tasksForStatus.slice(0, 4);

                  return (
                    <div key={status} className="kanban-column">
                      <h3>{status}</h3>
                      {displayedTasks.map((task) => (
                        <div key={task._id} className="task-card">
                          <h4>{task.title}</h4>
                          <p>
                            <span className={`status-label status-${task.status?.toLowerCase().replace(/\s+/g, '')}`}>
                              {task.status}
                            </span>
                          </p>
                          <p><strong>Priority:</strong> {task.priority}</p>
                          <p><strong>Assigned To:</strong> {task.assignedTo || 'Unassigned'}</p>
                          <button onClick={() => setEditTask(task)}>Edit</button>
                          <button onClick={() => deleteTask(task._id)}>Delete</button>
                        </div>
                      ))}
                      {tasksForStatus.length > 4 && (
                        <button
                          onClick={() =>
                            setExpandedStatuses((prev) => ({ ...prev, [status]: !isExpanded }))
                          }
                          className="toggle-button"
                        >
                          {isExpanded ? 'Show Less' : 'Show More'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {editTask && (
              <div className="edit-task-form">
                <h4>Edit Task</h4>
                <form onSubmit={handleEditSubmit}>
                  <input type="text" name="title" value={editTask.title} onChange={handleEditChange} placeholder="Title" />
                  <textarea name="description" value={editTask.description} onChange={handleEditChange} placeholder="Description" />
                  <select name="status" value={editTask.status} onChange={handleEditChange}>
                    <option value="TODO">TODO</option>
                    <option value="IN WORK">IN WORK</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                  <select name="priority" value={editTask.priority} onChange={handleEditChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <input type="email" name="assignedTo" value={editTask.assignedTo || ''} onChange={handleEditChange} placeholder="Assigned To (Email)" />
                  <button type="submit">Save Changes</button>
                  <button type="button" onClick={() => setEditTask(null)}>Cancel</button>
                </form>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
