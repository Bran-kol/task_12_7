import React, { useState, useEffect } from "react";
import {
  Home,
  FolderOpen,
  CheckCircle,
  Calendar,
  MessageCircle,
  BarChart3,
  Settings,
  Bell,
  Plus,
  AlertCircle,
  User,
  Filter,
  ChevronDown,
  CalendarDays,
  MoreHorizontal,
  Users,
  UserCheck,
  Eye,
  X,
  LogOut,
} from "lucide-react";
import { useUser } from '../contexts/UserContext.js';
import apiService from '../services/apiService';
import "./styles/Dashboard.css";
import AdminDashboard from "./dashboards/AdminDashboard";
import ManagerDashboard from "./dashboards/ManagerDashboard";
import CollaboratorDashboard from "./dashboards/CollaboratorDashboard";
import ClientDashboard from "./dashboards/ClientDashboard";
import Stats from './Stats';
import RecentTasks from './RecentTasks';
import ActiveProjects from './ActiveProjects';



// Role-based navigation configurations
const roleConfigs = {
  ADMIN: {
    navItems: [
      { icon: <Home />, label: "Dashboard", active: true },
      { icon: <FolderOpen />, label: "All Projects" },
      { icon: <Users />, label: "User Management" },
      { icon: <CheckCircle />, label: "All Tasks" },
      { icon: <BarChart3 />, label: "Analytics" },
      { icon: <Calendar />, label: "Calendar" },
      { icon: <MessageCircle />, label: "Messages" },
      { icon: <Settings />, label: "System Settings" },
    ]
  },
  MANAGER: {
    navItems: [
      { icon: <Home />, label: "Dashboard", active: true },
      { icon: <FolderOpen />, label: "My Projects" },
      { icon: <CheckCircle />, label: "Team Tasks" },
      { icon: <Users />, label: "Team Members" },
      { icon: <BarChart3 />, label: "Reports" },
      { icon: <Calendar />, label: "Calendar" },
      { icon: <MessageCircle />, label: "Messages" },
      { icon: <Settings />, label: "Settings" },
    ]
  },
  COLLABORATOR: {
    navItems: [
      { icon: <Home />, label: "Dashboard", active: true },
      { icon: <CheckCircle />, label: "My Tasks" },
      { icon: <FolderOpen />, label: "Projects" },
      { icon: <Calendar />, label: "Calendar" },
      { icon: <MessageCircle />, label: "Messages" },
      { icon: <Settings />, label: "Settings" },
    ]
  },
  CLIENT: {
    navItems: [
      { icon: <Home />, label: "Dashboard", active: true },
      { icon: <FolderOpen />, label: "My Projects" },
      { icon: <Eye />, label: "Progress Reports" },
      { icon: <MessageCircle />, label: "Messages" },
      { icon: <Settings />, label: "Account Settings" },
    ]
  }
};

const Sidebar = ({ userRole }) => {
  const config = roleConfigs[userRole] || roleConfigs.CLIENT;
  
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__icon">
          <Home size={28} strokeWidth={2.2} />
        </div>
        <div>
          <span className="sidebar__title">TaskFlow</span>
        </div>
      </div>
      <nav className="sidebar__nav">
        {config.navItems.map((item, index) => (
          <SidebarNavItem 
            key={index}
            active={item.active}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>
    </aside>
  );
};

const SidebarNavItem = ({ icon, label, active }) => (
  <div className={`sidebar__nav-item${active ? " active" : ""}`}>
    <span className="sidebar__nav-icon">{icon}</span>
    <span>{label}</span>
  </div>
);

const UserProfile = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="topbar__user" onClick={() => setShowDropdown(!showDropdown)}>
      <div className="topbar__user-avatar">
        <img 
          src={user.profile_picture || "/api/placeholder/40/40"} 
          alt={user.full_name}
          onError={(e) => {
            e.target.src = "/api/placeholder/40/40";
          }}
        />
      </div>
      <div className="topbar__user-info">
        <div className="topbar__user-name">{user.full_name}</div>
        <div className="topbar__user-role">{user.role}</div>
      </div>
      <ChevronDown size={16} className="topbar__user-arrow" />
      
      {showDropdown && (
        <div className="user-dropdown">
          <button onClick={onLogout} className="user-dropdown__item">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

const NotificationDropdown = ({ notifications, isOpen, onClose, onMarkAsRead }) => (
  <div className={`notification-dropdown ${isOpen ? 'notification-dropdown--open' : ''}`}>
    <div className="notification-dropdown__header">
      <h3>Notifications</h3>
      <button onClick={onClose} className="notification-dropdown__close">
        <X size={16} />
      </button>
    </div>
    <div className="notification-dropdown__list">
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`notification-item ${notification.is_read ? '' : 'notification-item--unread'}`}
            onClick={() => onMarkAsRead(notification.id)}
          >
            <div className="notification-item__icon">
              {notification.notification_type === 'TASK_ASSIGNED' && <CheckCircle size={16} />}
              {notification.notification_type === 'PROJECT_ASSIGNED' && <FolderOpen size={16} />}
              {notification.notification_type === 'COMMENT_ADDED' && <MessageCircle size={16} />}
              {notification.notification_type === 'SYSTEM' && <AlertCircle size={16} />}
            </div>
            <div className="notification-item__content">
              <div className="notification-item__title">{notification.title}</div>
              <div className="notification-item__message">{notification.message}</div>
              <div className="notification-item__time">
                {new Date(notification.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="notification-dropdown__empty">No new notifications</div>
      )}
    </div>
  </div>
);

const NewTaskModal = ({ isOpen, onClose, userRole, onTaskCreated }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    due_date: '',
    project: '',
    assigned_to: []
  });
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (taskData.project) {
      loadAvailableUsers(taskData.project);
    }
  }, [taskData.project]);

  const loadProjects = async () => {
    try {
      const response = await apiService.getProjects();
      setProjects(response.results || response);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadAvailableUsers = async (projectId) => {
    try {
      const response = await apiService.getAvailableUsers(projectId);
      setAvailableUsers(response.users || []);
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiService.createTask(taskData);
      onTaskCreated();
      onClose();
      setTaskData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        due_date: '',
        project: '',
        assigned_to: []
      });
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTaskData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssigneeChange = (userId) => {
    setTaskData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(userId)
        ? prev.assigned_to.filter(id => id !== userId)
        : [...prev.assigned_to, userId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>Create New Task</h2>
          <button onClick={onClose} className="modal__close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-group">
            <label htmlFor="title">Task Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={taskData.title}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={taskData.description}
              onChange={handleInputChange}
              rows="3"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={taskData.priority}
                onChange={handleInputChange}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="due_date">Due Date</label>
              <input
                type="datetime-local"
                id="due_date"
                name="due_date"
                value={taskData.due_date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="project">Project</label>
            <select
              id="project"
              name="project"
              value={taskData.project}
              onChange={handleInputChange}
              required
            >
              <option value="">Select project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          {(userRole === 'ADMIN' || userRole === 'MANAGER') && availableUsers.length > 0 && (
            <div className="form-group">
              <label>Assign To</label>
              <div className="assignee-list">
                {availableUsers.map(user => (
                  <label key={user.id} className="assignee-item">
                    <input
                      type="checkbox"
                      checked={taskData.assigned_to.includes(user.id)}
                      onChange={() => handleAssigneeChange(user.id)}
                    />
                    <span>{user.full_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div className="modal__actions">
            <button type="button" onClick={onClose} className="btn btn--secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Topbar = ({ user, onNewTask, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await apiService.getNotifications();
      setNotifications(response.results || response);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="topbar">
      <UserProfile user={user} onLogout={onLogout} />
      <h1 className="topbar__title">Dashboard</h1>
      <span className="topbar__status">
        <span className="topbar__status-dot" /> All systems operational
      </span>
      <div className="topbar__search">
        <input type="text" placeholder="Search tasks, projects..." />
      </div>
      <button className="topbar__newtask" onClick={onNewTask}>
        <Plus size={18} />
        New Task
      </button>
      <div className="topbar__notifications">
        <button 
          className="topbar__bell" 
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="topbar__bell-count">{unreadCount}</span>
          )}
        </button>
        <NotificationDropdown 
          notifications={notifications}
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={handleMarkAsRead}
        />
      </div>
    </div>
  );
};





export default function Dashboard() {
  const { user, logout } = useUser();

  let dashboardComponent;
  switch (user?.role) {
    case "ADMIN":
      dashboardComponent = <AdminDashboard />;
      break;
    case "MANAGER":
      dashboardComponent = <ManagerDashboard />;
      break;
    case "COLLABORATOR":
      dashboardComponent = <CollaboratorDashboard />;
      break;
    case "CLIENT":
    default:
      dashboardComponent = <ClientDashboard />;
      break;
  }

  return (
    <div className="dashboardlayout">
      <Sidebar userRole={user?.role || 'CLIENT'} />
      <main className="dashboardmain">
        {dashboardComponent}
      </main>
    </div>
  );
}