import React, { useState } from 'react';
import './DashboardCharts.css';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';

const STATUS_COLORS = {
  TODO: '#1E90FF',
  'IN WORK': '#FFBF00',
  'IN PROGRESS': '#7851A9',
  COMPLETED: '#28A745',
};

// Normalize status values safely
const normalizeStatus = (status) => {
  const s = (status || '').trim().toUpperCase();
  if (s === 'INWORK' || s === 'WORKING') return 'IN WORK';
  if (s === 'INPROGRESS' || s === 'PROGRESS') return 'IN PROGRESS';
  if (['TODO', 'IN WORK', 'IN PROGRESS', 'COMPLETED'].includes(s)) return s;
  return 'TODO';
};

function DashboardCharts({ tasks, users }) {
  const [selectedUser, setSelectedUser] = useState('All');

  const filteredTasks = selectedUser === 'All'
    ? tasks
    : tasks.filter((task) => task.assignedTo?.toLowerCase() === selectedUser.toLowerCase());

  const statusCounts = {
    TODO: 0,
    'IN WORK': 0,
    'IN PROGRESS': 0,
    COMPLETED: 0,
  };

  filteredTasks.forEach((task) => {
    const normalizedStatus = normalizeStatus(task.status);
    if (statusCounts[normalizedStatus] !== undefined) {
      statusCounts[normalizedStatus]++;
    }
  });

  const totalTasks = Object.values(statusCounts).reduce((sum, val) => sum + val, 0);

  const pieData = Object.keys(statusCounts).map((status) => ({
    name: status,
    value: statusCounts[status],
    percentage: totalTasks ? ((statusCounts[status] / totalTasks) * 100).toFixed(1) : 0,
  }));

  return (
    <div className="dashboard-charts">
      <div className="chart-header">
        <label><strong>Filter by Assigned User:</strong></label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="user-filter-select"
        >
          <option value="All">All</option>
          {users.map((user) => (
            <option key={user._id} value={user.email}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Task Status % (Pie)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Task Status Count (Bar)</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pieData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCharts;
