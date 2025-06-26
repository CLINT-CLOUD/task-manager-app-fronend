import React, { useEffect, useState } from 'react';
import axios from 'axios';

function TaskList() {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load tasks');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="task-list">
      <h3>Your Tasks</h3>
      {tasks.length === 0 ? (
        <p>No tasks found</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task._id} className="task-card">
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              <p>Status: <strong>{task.status}</strong></p>
              <p>Priority: <strong>{task.priority}</strong></p>
              <p>Assigned To: {task.assignedTo?.email || 'You'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TaskList;
