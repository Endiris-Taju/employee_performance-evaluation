import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Tasks.css";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

function Tasks() {
  const { employees } = useData();
  const { email } = useAuth();

  const me = employees.find((e) => e.email === email);
  const initialTasks = Array(6).fill().map(() => ({ task: "", percent: "", rank: "" }));

  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  const [employee, setEmployee] = useState({
    id: "",
    name: "",
    department: "",
    rank: "",
    year: formattedDate
  });

  const [tasks, setTasks] = useState(initialTasks);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleTaskChange = (index, field, value) => {
    const updated = [...tasks];
    updated[index][field] = value;
    setTasks(updated);
    setSuccess("");
    setError("");
  };

  const totalScore = tasks.reduce(
    (sum, t) => sum + ((Number(t.percent || 0) / 100) * 70 * (Number(t.rank || 0) / 4)),
    0
  );
  const averageScore = tasks.length > 0 ? (totalScore / tasks.length).toFixed(2) : 0;
  const totalPercent = tasks.reduce((sum, t) => sum + Number(t.percent || 0), 0);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!employee.id) {
      setError("Please select an employee to evaluate.");
      return;
    }
    if (totalPercent !== 100) {
      setError("Task percentages must total 100%.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          employee_id: employee.id,
          evaluator_id: me.id,
          type: "workrate",
          tasks: tasks.filter((t) => t.task && t.percent && t.rank),
          total_score: totalScore,
          max_score: 70,
          percentage: (totalScore / 70 * 100).toFixed(1),
          date: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save evaluation");
      }

      setSuccess(`Work Rate Evaluation submitted! Total Score: ${totalScore.toFixed(2)} / 70`);
      setTasks(initialTasks);
      setEmployee({ id: "", name: "", department: "", rank: "", year: formattedDate });
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to save evaluation.");
    }
  };

  return (
    <div className="peer-eval-form">
      <header className="header">
        <img src={logo} alt="logo" className="form-logo" />
        <Link to="/leader" className="home-btn">Back to Dashboard</Link>
      </header>

      <h2>ADAMA SCIENCE AND TECHNOLOGY UNIVERSITY</h2>
      <h4>Team Leader Evaluation (Out of 70)</h4>

      <div className="employee-info">
        <label>Employee Name:
          <select
            value={employee.id}
            onChange={(e) => {
              const emp = employees.find((em) => em.id.toString() === e.target.value);
              if (emp) {
                setEmployee({ id: emp.id, name: emp.name, department: emp.department, rank: emp.rank, year: formattedDate });
              }
            }}
          >
            <option value="">-- Select Employee --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </label>
        <label>Department:<input type="text" readOnly value={employee.department} /></label>
        <label>Rank:<input type="text" readOnly value={employee.rank} /></label>
        <label>Date of Evaluation:<input type="text" readOnly value={employee.year} /></label>
      </div>

      <table className="task-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Recorded Tasks</th>
            <th>Percent (%)</th>
            <th colSpan="4">Rank (1-4)</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td><input type="text" value={t.task} onChange={(e) => handleTaskChange(index, "task", e.target.value)} /></td>
              <td><input type="number" value={t.percent} onChange={(e) => handleTaskChange(index, "percent", e.target.value)} /></td>
              {[1, 2, 3, 4].map((rank) => (
                <td key={rank}>
                  <input
                    type="radio"
                    name={`rank-${index}`}
                    value={rank}
                    checked={t.rank === String(rank)}
                    onChange={(e) => handleTaskChange(index, "rank", e.target.value)}
                  />
                </td>
              ))}
              <td>{t.percent && t.rank ? ((Number(t.percent) / 100) * 70 * (Number(t.rank) / 4)).toFixed(2) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="results">
        <label>Total Percent:<input type="text" readOnly value={totalPercent + "%"} /></label>
        <label>Total Score (out of 70):<input type="text" readOnly value={totalScore.toFixed(2)} /></label>
        <label>Average Score:<input type="text" readOnly value={averageScore} /></label>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button className="btn primary" onClick={handleSubmit}>Submit & Save</button>
      </div>
    </div>
  );
}

export default Tasks;
