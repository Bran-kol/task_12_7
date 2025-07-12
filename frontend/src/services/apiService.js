import api from '../api';

class ApiService {
  // Authentication
  async login(email, password, remember = false) {
    try {
      const response = await api.post('auth/login/', {
        email,
        password,
        remember
      });
      
      if (response.data.access) {
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await api.post('auth/refresh/', {
        refresh: refreshToken
      });
      
      localStorage.setItem('accessToken', response.data.access);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
      
      return response.data;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  // Dashboard
  async getDashboardStats() {
    try {
      const response = await api.get('dashboard/stats/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async getRecentTasks() {
    try {
      const response = await api.get('dashboard/recent-tasks/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async getActiveProjects() {
    try {
      const response = await api.get('dashboard/active-projects/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Users
  async getUsers() {
    try {
      const response = await api.get('users/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async createUser(userData) {
    try {
      const response = await api.post('users/', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await api.put(`users/${userId}/`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await api.delete(`users/${userId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async getAvailableUsers(projectId = null) {
    try {
      const params = projectId ? { project_id: projectId } : {};
      const response = await api.get('users/available/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Projects
  async getProjects() {
    try {
      const response = await api.get('projects/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async createProject(projectData) {
    try {
      const response = await api.post('projects/', projectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async updateProject(projectId, projectData) {
    try {
      const response = await api.put(`projects/${projectId}/`, projectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async deleteProject(projectId) {
    try {
      const response = await api.delete(`projects/${projectId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async getKanbanBoard(projectId) {
    try {
      const response = await api.get(`projects/${projectId}/kanban/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Tasks
  async getTasks(projectId = null) {
    try {
      const params = projectId ? { project_id: projectId } : {};
      const response = await api.get('tasks/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async createTask(taskData) {
    try {
      const response = await api.post('tasks/', taskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async updateTask(taskId, taskData) {
    try {
      const response = await api.put(`tasks/${taskId}/`, taskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async deleteTask(taskId) {
    try {
      const response = await api.delete(`tasks/${taskId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Notifications
  async getNotifications() {
    try {
      const response = await api.get('notifications/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const response = await api.post(`notifications/${notificationId}/read/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // Password Reset
  async forgotPassword(email) {
    try {
      const response = await api.post('auth/forgot-password/', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async verifyResetCode(email, code) {
    try {
      const response = await api.post('auth/verify-code/', { email, code });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  async changePassword(email, code, password) {
    try {
      const response = await api.post('auth/change-password/', { email, code, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new ApiService();