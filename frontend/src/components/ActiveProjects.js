import { FolderOpen, MoreHorizontal } from "lucide-react";
import React from "react";

const ActiveProjects = ({ projects, userRole }) => {
  return (
    <div className="activeprojects card">
      <div className="activeprojects__title">
        {userRole === 'ADMIN' ? 'All Active Projects' : 
         userRole === 'MANAGER' ? 'Team Projects' :
         userRole === 'COLLABORATOR' ? 'My Projects' :
         'Project Progress'}
      </div>
      <div className="activeprojects__desc">
        {userRole === 'ADMIN' ? 'System-wide project overview' : 
         userRole === 'MANAGER' ? 'Projects under your management' :
         userRole === 'COLLABORATOR' ? 'Projects you are working on' :
         'Your commissioned projects'}
      </div>
      
      {projects && projects.length > 0 ? (
        projects.map((project) => (
          <div key={project.id} className="activeprojects__card">
            <div className="activeprojects__icon">
              <FolderOpen size={28} />
            </div>
            <div className="activeprojects__info">
              <div className="activeprojects__name">{project.name}</div>
              <div className="activeprojects__tasks">
                {project.task_stats?.total || 0} tasks
              </div>
              <div className="activeprojects__progress">
                <div className="activeprojects__progressbar">
                  <div style={{ width: `${project.progress_percentage || 0}%` }} />
                </div>
                <div className="activeprojects__percent">
                  {Math.round(project.progress_percentage || 0)}%
                </div>
              </div>
            </div>
            <button className="activeprojects__more">
              <MoreHorizontal size={22} />
            </button>
          </div>
        ))
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
          No active projects found
        </div>
      )}
    </div>
  );
};
export default ActiveProjects;
