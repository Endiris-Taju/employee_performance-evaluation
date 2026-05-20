// src/pages/leader/LeaderTasks.jsx
import React, { useEffect, useState } from "react";
import { useData } from "../../context/DataContext";

function LeaderTasks() {
  const { tasks } = useData(); // tasks from context or API
  const [leaderTasks, setLeaderTasks] = useState([]);

  useEffect(() => {
    // filter tasks that belong to leader’s team
    const teamTasks = tasks.filter(t => t.assignedBy === "leader");
    setLeaderTasks(teamTasks);
  }, [tasks]);

  return (
    <div className="page">
      <h2>📋 Team Tasks</h2>
      {leaderTasks.length === 0 ? (
        <p>No tasks assigned yet.</p>
      ) : (
        <ul>
          {leaderTasks.map(task => (
            <li key={task.id}>
              <strong>{task.title}</strong> – {task.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LeaderTasks;
