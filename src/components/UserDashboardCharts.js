import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TaskForm.css';
import './Sidebar.css';
import './Alert.css';
import DashboardCharts from './DashboardCharts';

function UserDashboard() {
  const [form, setForm] = useState({
    email: '',
    title: '',
    description: '',
    priority: 'Medium',
  });

  const [assignedTasks, setAssignedTasks] = useState([]);
  const [createdTasks, setCreatedTasks] = useState([]);
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [activeSection, setActiveSection] = useState('create'); // 'create' or 'dashboard'

  const token = localStorage.getItem('token');
  const payload = token ? JSON.parse(atob(token.split('.')[1])) : {};
  const userId = payload.id;
  const userEmail = payload.email;

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allTasks = res.data;

      const assigned = allTasks.filter(task => task.assignedTo === userEmail);
      const created = allTasks.filter(
        task => task.createdBy === userId && task.assignedTo !== userEmail
      );

      setAssignedTasks(assigned);
      setCreatedTasks(created);
    } catch (err) {
      setAlert({ message: 'Could not load tasks', type: 'error' });
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/tasks', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ email: '', title: '', description: '', priority: 'Medium' });
      setAlert({ message: 'Task created successfully!', type: 'success' });
      fetchTasks();
    } catch (err) {
      setAlert({ message: 'Error creating task', type: 'error' });
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus }, {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const dismissAlert = () => setAlert({ message: '', type: '' });

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h2>User Panel</h2>
        <button onClick={() => setActiveSection('create')}>Create Task</button>
        <button onClick={() => setActiveSection('dashboard')}>Dashboard</button>
        <button onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main-content">
        {alert.message && (
          <div className={`alert-box ${alert.type}`}>
            <span>{alert.message}</span>
            <button className="close-btn" onClick={dismissAlert}>×</button>
          </div>
        )}

        {activeSection === 'create' && (
          <>
            <form onSubmit={handleSubmit} className="task-form">
              <h3>Create Task</h3>
              <input
                type="email"
                placeholder="Assign to Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <button type="submit">Create Task</button>
            </form>

            <div className="kanban-section">
              <h2>My Assigned Tasks</h2>
              <div className="kanban-board">
                {['Pending', 'Working', 'Completed'].map((status) => (
                  <div className="kanban-column" key={status}>
                    <h3>{status}</h3>
                    {assignedTasks.filter((task) => task.status === status).map((task) => (
                      <div key={task._id} className={`task-card ${task.status.toLowerCase()}`}>
                        <strong>{task.title}</strong>
                        <p>{task.description}</p>
                        <em>Priority: {task.priority}</em>
                        {task.status === 'Completed' && (
                          <div className="completed-label">✔ Completed</div>
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
                  </div>
                ))}
              </div>
            </div>

            <div className="kanban-section">
              <h2>My Created Tasks</h2>
              <div className="kanban-board">
                {['Pending', 'Working', 'Completed'].map((status) => (
                  <div className="kanban-column" key={status}>
                    <h3>{status}</h3>
                    {createdTasks.filter((task) => task.status === status).map((task) => (
                      <div key={task._id} className={`task-card ${task.status.toLowerCase()}`}>
                        <strong>{task.title}</strong>
                        <p>{task.description}</p>
                        <em>Priority: {task.priority}</em>
                        {task.status === 'Completed' && (
                          <div className="completed-label">✔ Completed</div>
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
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeSection === 'dashboard' && (
          <div id="user-charts">
            <h2>User Task Dashboard</h2>
            <DashboardCharts
              tasks={[...assignedTasks, ...createdTasks]}
              users={[{ _id: userId, email: userEmail }]}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default UserDashboard;
