// src/pages/leader/LeaderReports.jsx
import React, { useEffect, useState } from "react";
import { useData } from "../../context/DataContext";

function LeaderReports() {
  const { reports } = useData();
  const [teamReports, setTeamReports] = useState([]);

  useEffect(() => {
    // filter only leader-related reports
    const filtered = reports.filter(r => r.type === "team");
    setTeamReports(filtered);
  }, [reports]);

  return (
    <div className="page">
      <h2>📑 Team Reports</h2>
      {teamReports.length === 0 ? (
        <p>No reports submitted yet.</p>
      ) : (
        <ul>
          {teamReports.map(rep => (
            <li key={rep.id}>
              <strong>{rep.title}</strong> – {rep.date}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LeaderReports;
