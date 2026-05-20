// src/pages/AllEvaluations.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import "./AllEvaluations.css";
import { useData } from "../../context/DataContext";

function AllEvaluations() {
  const { employees, evaluations } = useData();

  const results = useMemo(() => {
    const grouped = {};

    evaluations.forEach((ev) => {
      ev.submissions?.forEach((s) => {
        const empId = s.aboutMemberId;
        if (!grouped[empId]) {
          const emp = employees.find((e) => e.id === empId);
          grouped[empId] = {
            id: emp?.id,
            name: emp?.name,
            department: emp?.department,
            self: 0,
            manager: 0,
            leader: 0,
            peer: 0,
          };
        }

        if (ev.type === "behavioral") {
          const from = employees.find((e) => e.id === s.fromMemberId);

          if (from?.role === "manager") {
            grouped[empId].manager += s.answers.reduce((sum, a) => sum + a.score, 0);
          } else if (from?.role === "leader") {
            // ✅ show submitted total score (out of 70)
            grouped[empId].leader += s.score ?? 0;
          } else if (empId === s.fromMemberId) {
            grouped[empId].self += s.answers.reduce((sum, a) => sum + a.score, 0);
          }
        } else if (ev.type === "team") {
          grouped[empId].peer += s.score || 0;
        }
      });
    });

    return Object.values(grouped);
  }, [evaluations, employees]);

  return (
    <div className="all-evaluations">
      <header className="header">
        <img src="/src/assets/logo.png" alt="logo" className="form-logo" />
        <Link to="/leader/dashboard" className="home-btn">
          Back to Dashboard
        </Link>
      </header>

      <h2>ADAMA SCIENCE AND TECHNOLOGY UNIVERSITY</h2>
      <h3>📑 Collected Evaluations Report</h3>

      <table className="evaluation-table">
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Department</th>
            <th>Self (5)</th>
            <th>Manager (10)</th>
            <th>Leader (70)</th>
            <th>Peer/Team (15)</th>
            <th>Total (100)</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const total = r.self + r.manager + r.leader + r.peer;
            return (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.department}</td>
                <td>{r.self.toFixed(2)}</td>
                <td>{r.manager.toFixed(2)}</td>
                <td>{r.leader.toFixed(2)}</td>
                <td>{r.peer.toFixed(2)}</td>
                <td><strong>{total.toFixed(2)}</strong></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AllEvaluations;
