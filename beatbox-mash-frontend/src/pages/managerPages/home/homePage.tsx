import React from 'react';
import EventStagesChart from '../../../components/eventStagesChart/eventStagesChart';
import TaskList from '../../../components/taskList/taskList';

const HomePageContent: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: "center", justifyContent: "center"}}>
      <TaskList />
      <EventStagesChart />
    </div>
  );
};

export default HomePageContent;