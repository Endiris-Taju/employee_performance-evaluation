// src/pages/Admin/Teams.jsx
import React, { useState } from "react";
import "./Teams.css"; // ✅ create this file for styling
import { useData } from "../../context/DataContext";

function Teams() {
  const { teams, employees } = useData();
  const [expanded, setExpanded] = useState(null);

  const toggleExpand = (teamId) => {
    setExpanded(expanded === teamId ? null : teamId);
  };

  // Group teams by department
  const groupTeamsByDepartment = (teams) => {
    if (!teams || teams.length === 0) return {};
    
    return teams.reduce((acc, team) => {
      const department = team.department || 'Unassigned';
      if (!acc[department]) {
        acc[department] = [];
      }
      acc[department].push(team);
      return acc;
    }, {});
  };

  const groupedTeams = groupTeamsByDepartment(teams);

  return (
    <div className="teams-page">
      <h1>Teams Overview - Grouped by Department</h1>

      {teams?.length === 0 ? (
        <p>No teams have been created yet.</p>
      ) : (
        <div className="department-groups">
          {Object.entries(groupedTeams).map(([department, departmentTeams]) => (
            <div key={department} className="department-section">
              <div className="department-header">
                <h2>{department}</h2>
                <span className="team-count">{departmentTeams.length} teams</span>
              </div>
              
              <div className="teams-grid">
                {departmentTeams.map((team) => {
                  const leader = employees.find((e) => e.id === team.leaderId);
                  const members = employees.filter((e) =>
                    team.memberIds?.includes(e.id)
                  );

                  return (
                    <div key={team.id} className="team-card">
                      <div className="team-header">
                        <h3>{team.name}</h3>
                        <div className="team-stats">
                          <span className="member-count">{members.length} members</span>
                        </div>
                      </div>
                      
                      <div className="team-info">
                        <div className="info-item">
                          <strong>Leader:</strong> {leader ? leader.name : "N/A"}
                        </div>
                        <div className="info-item">
                          <strong>Department:</strong> {team.department}
                        </div>
                      </div>

                      <button
                        className="btn small expand-btn"
                        onClick={() => toggleExpand(team.id)}
                      >
                        {expanded === team.id ? "Hide" : "View"} Members
                      </button>

                      {expanded === team.id && (
                        <div className="team-members">
                          <h4>Team Members</h4>
                          <div className="members-list">
                            {members.map((member) => (
                              <div key={member.id} className="member-item">
                                <div className="member-info">
                                  <div className="member-name">{member.name}</div>
                                  <div className="member-position">{member.position}</div>
                                </div>
                                <div className="member-contact">
                                  <div className="member-email">{member.email}</div>
                                  <div className="member-phone">{member.phone}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Teams;
