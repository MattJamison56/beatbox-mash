/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import './taskList.css';

const TaskList: React.FC = () => {
  const tasks = [
    { id: 1, text: 'Approval queue contains 424 report(s)', link: '/approval-queue' },
    { id: 2, text: 'Process 24 approved report(s)', link: '/process-approved-reports' },
    { id: 3, text: 'Process 5 pending payroll(s)', link: '/process-pending-payroll' },
    { id: 4, text: '33 document(s) have been submitted within last 7 day(s)', link: '/submitted-documents' },
    { id: 5, text: 'There are 1353 venue(s) with no region', link: '/venues-no-region' }
  ];

  return (
    <div className="task-list-container">
      <h2>Get Things Done</h2>
      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className="task-item">
            <a href={task.link} className="task-link">
              <i className="fas fa-clipboard-list"></i> {/* Icon representing a clipboard or document */}
              {task.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
