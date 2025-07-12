import React, { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import Stats from "../Stats";
import RecentTasks from "../RecentTasks";
import ActiveProjects from "../ActiveProjects";

export default function CollaboratorDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [statsRes, tasksRes, projectsRes] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecentTasks(),
          apiService.getActiveProjects(),
        ]);
        setStats(statsRes.stats);
        setRecentTasks(tasksRes.tasks || []);
        setActiveProjects(projectsRes.projects || []);
      } catch (err) {
        // handle error
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="collaborator-dashboard">
      <h1>My Dashboard</h1>
      <Stats stats={stats} />
      <div style={{ display: "flex", gap: 24 }}>
        <RecentTasks tasks={recentTasks} userRole="COLLABORATOR" />
        <ActiveProjects projects={activeProjects} userRole="COLLABORATOR" />
      </div>
    </div>
  );
}
