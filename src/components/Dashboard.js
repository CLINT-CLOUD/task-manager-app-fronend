import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TaskForm from './TaskForm';
import './Dashboard.css';
import { jwtDecode } from 'jwt-decode';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setUserEmail(decoded.email);
      setUserName(decoded.name || 'User');
    }
    fetchAssignedTasks();
  }, []);

  const fetchAssignedTasks = async () => {
    try {
      const res = await axios.get('/api/tasks/assigned', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (Array.isArray(res.data)) {
        setTasks(res.data);
      } else {
        console.error('Expected an array but got:', res.data);
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    }
  };

  const handleTaskCreated = () => {
    fetchAssignedTasks();
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setUpdatingTaskId(taskId);
      await axios.put(`/api/tasks/${taskId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      fetchAssignedTasks();
    } catch (err) {
      console.error('Failed to update status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const grouped = {
    TODO: [],
    'IN WORK': [],
    'IN PROGRESS': [],
    COMPLETED: [],
  };

  (Array.isArray(tasks) ? tasks : []).forEach(task => {
    grouped[task.status?.toUpperCase()]?.push(task);
  });

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="user-dropdown" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="user-label">
            <strong>{userName}</strong> ▼
          </div>
          {showDropdown && (
            <div className="dropdown-menu">
              <p><strong>Name:</strong> {userName}</p>
              <p><strong>Email:</strong> {userEmail}</p>
            </div>
          )}
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="task-section">
          <TaskForm onTaskCreated={handleTaskCreated} />
        </div>

        <div className="kanban-board">
          {Object.keys(grouped).map((status) => (
            <div key={status} className="kanban-column">
              <h3>{status}</h3>
              {grouped[status].map((task) => (
                <div key={task._id} className="task-card">
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <p><strong>Priority:</strong> {task.priority}</p>
                  <label>Status:</label>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    disabled={updatingTaskId === task._id}
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN WORK">IN WORK</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
