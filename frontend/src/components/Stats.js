import { Users, FolderOpen, CheckCircle, AlertCircle, CalendarDays, Eye, Home } from "lucide-react";
import React from "react";  


const Stats = ({ stats }) => {
  const renderStatCards = () => {
    if (!stats) return null;

    const statCards = [];
    
    Object.entries(stats).forEach(([key, value], index) => {
      const colors = ['blue', 'green', 'yellow', 'red'];
      const color = colors[index % colors.length];
      
      let icon, label;
      
      // Map different stat types to appropriate icons and labels
      switch(key) {
        case 'total_users':
          icon = <Users size={32} />;
          label = 'Total Users';
          break;
        case 'active_projects':
          icon = <FolderOpen size={32} />;
          label = 'Active Projects';
          break;
        case 'total_tasks':
          icon = <CheckCircle size={32} />;
          label = 'Total Tasks';
          break;
        case 'completed_tasks':
          icon = <CheckCircle size={32} />;
          label = 'Completed Tasks';
          break;
        case 'system_issues':
          icon = <AlertCircle size={32} />;
          label = 'System Issues';
          break;
        case 'managed_projects':
          icon = <FolderOpen size={32} />;
          label = 'Managed Projects';
          break;
        case 'team_tasks':
          icon = <CheckCircle size={32} />;
          label = 'Team Tasks';
          break;
        case 'overdue_tasks':
          icon = <AlertCircle size={32} />;
          label = 'Overdue Tasks';
          break;
        case 'my_tasks':
          icon = <CheckCircle size={32} />;
          label = 'My Tasks';
          break;
        case 'in_progress':
          icon = <CalendarDays size={32} />;
          label = 'In Progress';
          break;
        case 'pending_tasks':
          icon = <CalendarDays size={32} />;
          label = 'Pending Tasks';
          break;
        case 'my_projects':
          icon = <FolderOpen size={32} />;
          label = 'My Projects';
          break;
        case 'completed_projects':
          icon = <CheckCircle size={32} />;
          label = 'Completed Projects';
          break;
        case 'pending_review':
          icon = <Eye size={32} />;
          label = 'Pending Review';
          break;
        default:
          icon = <Home size={32} />;
          label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      
      statCards.push(
        <StatCard
          key={key}
          icon={icon}
          count={value.toString()}
          label={label}
          change="+0%"
          color={color}
        />
      );
    });
    
    return statCards;
  };

  return (
    <div className="stats">
      {renderStatCards()}
    </div>
  );
};
export default Stats;
const StatCard = ({ icon, count, label, change, color }) => (
  <div className={`statcard statcard--${color}`}>
    <div className="statcard__icon">{icon}</div>
    <div className="statcard__info">
      <div className="statcard__count">{count}</div>
      <div className="statcard__label">{label}</div>
    </div>
    <div className={`statcard__change statcard__change--${change.startsWith('+') ? 'positive' : 'negative'}`}>
      {change}
    </div>
  </div>
);