import { Filter, CalendarDays } from "lucide-react";
import React from "react";

const RecentTasks = ({ tasks, userRole }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPriorityClass = (priority) => {
    return `priority-pill priority-pill--${priority.toLowerCase()}`;
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'TODO': 'pending',
      'IN_PROGRESS': 'in-progress', 
      'IN_REVIEW': 'in-review',
      'DONE': 'completed'
    };
    return `status-pill status-pill--${statusMap[status] || 'pending'}`;
  };

  return (
    <div className="recenttasks card">
      <div className="recenttasks__header">
        <div>
          <div className="recenttasks__title">Recent Tasks</div>
          <div className="recenttasks__desc">
            {userRole === 'ADMIN' ? 'All recently updated tasks' : 
             userRole === 'MANAGER' ? 'Team tasks updated recently' :
             userRole === 'COLLABORATOR' ? 'Your recently updated tasks' :
             'Project tasks updated recently'}
          </div>
        </div>
        <div className="recenttasks__actions">
          <button>
            <Filter size={18} /> Filter
          </button>
          <button>
            <CalendarDays size={18} /> Sort
          </button>
        </div>
      </div>
      <table className="recenttasks__table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Status</th>
            <th>Priority</th>
            {(userRole === 'ADMIN' || userRole === 'MANAGER') && <th>Assignee</th>}
            <th>Due Date</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <div>
                    <div className="recenttasks__taskname">{task.title}</div>
                    <div className="recenttasks__project">
                      {task.project?.name || 'No Project'}
                    </div>
                  </div>
                </td>
                <td>
                  <span className={getStatusClass(task.status)}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span className={getPriorityClass(task.priority)}>
                    {task.priority}
                  </span>
                </td>
                {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
                  <td>
                    <div className="recenttasks__assignee">
                      {task.assigned_to && task.assigned_to.length > 0 ? (
                        <>
                          <span className="recenttasks__avatar">
                            {task.assigned_to[0].first_name.charAt(0)}
                            {task.assigned_to[0].last_name.charAt(0)}
                          </span>
                          <span>{task.assigned_to[0].full_name}</span>
                        </>
                      ) : (
                        <span>Unassigned</span>
                      )}
                    </div>
                  </td>
                )}
                <td>{formatDate(task.due_date)}</td>
                <td>
                  <div className="recenttasks__progress">
                    <span>{task.status === 'DONE' ? '100%' : '60%'}</span>
                    <div className="recenttasks__progressbar">
                      <div style={{ width: task.status === 'DONE' ? '100%' : '60%' }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                No tasks found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
export default RecentTasks;
