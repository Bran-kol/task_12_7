import React, { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import Stats from "../Stats";
import ActiveProjects from "../ActiveProjects";
import RecentTasks from "../RecentTasks";

export default function ClientDashboard() {
  const [stats, setStats] = useState(null);
  const [activeProjects, setActiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [statsRes, projectsRes] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getActiveProjects(),
        ]);
        setStats(statsRes.stats);
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
    <div className="client-dashboard">
      <h1>Client Dashboard</h1>
      <Stats stats={stats} />
      <ActiveProjects projects={activeProjects} userRole="CLIENT" />
    </div>
  );
}
