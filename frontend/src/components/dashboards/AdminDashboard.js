import React, { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import Stats from "../Stats";
import RecentTasks from "../RecentTasks";
import ActiveProjects from "../ActiveProjects";
// If you want a users list: import UsersList from "../UsersList"; (You can create this later)

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  // const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [statsRes, tasksRes, projectsRes/*, usersRes*/] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecentTasks(),
          apiService.getActiveProjects(),
          // apiService.getUsers(),
        ]);
        setStats(statsRes.stats);
        setRecentTasks(tasksRes.tasks || []);
        setActiveProjects(projectsRes.projects || []);
        // setUsers(usersRes.results || usersRes);
      } catch (err) {
        // handle error
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <Stats stats={stats} />
      <div style={{ display: "flex", gap: 24 }}>
        <RecentTasks tasks={recentTasks} userRole="ADMIN" />
        <ActiveProjects projects={activeProjects} userRole="ADMIN" />
      </div>
      {/* Add charts, quick actions, UsersList, etc. here */}
    </div>
  );
}
