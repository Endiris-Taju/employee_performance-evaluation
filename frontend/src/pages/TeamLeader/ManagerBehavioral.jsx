import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ManagerBehavioral.css";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

function ManagerBehavioral() {
  const { employees, evaluations, submitBehavioral } = useData();
  const { name } = useAuth();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [answers, setAnswers] = useState({
    communication: "",
    teamwork: "",
    problemSolving: "",
    leadership: "",
    adaptability: "",
    workQuality: ""
  });

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
    setSuccess("");
    setError("");
  };

  const handleAnswerChange = (question, value) => {
    setAnswers({
      ...answers,
      [question]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedEmployee) {
      setError("Please select an employee to evaluate");
      return;
    }

    const hasEmptyAnswers = Object.values(answers).some(answer => answer === "");
    if (hasEmptyAnswers) {
      setError("Please complete all evaluation questions");
      return;
    }

    try {
      const selectedEmp = employees.find(emp => emp.id === parseInt(selectedEmployee));
      
      await submitBehavioral({
        employeeId: parseInt(selectedEmployee),
        scores: {
          communication: Number(answers.communication),
          teamwork: Number(answers.teamwork),
          problemSolving: Number(answers.problemSolving),
          leadership: Number(answers.leadership),
          adaptability: Number(answers.adaptability),
          workQuality: Number(answers.workQuality)
        },
        totalScore:
          Number(answers.communication) +
          Number(answers.teamwork) +
          Number(answers.problemSolving) +
          Number(answers.leadership) +
          Number(answers.adaptability) +
          Number(answers.workQuality),
        maxScore: 6 * 4, // 6 questions, 1-4 scale
        date: new Date().toISOString()
      });

      setSuccess(`Behavioral evaluation for ${selectedEmp?.name} saved successfully!`);
      
      setSelectedEmployee("");
      setAnswers({
        communication: "",
        teamwork: "",
        problemSolving: "",
        leadership: "",
        adaptability: "",
        workQuality: ""
      });

    } catch (err) {
      setError("Failed to save evaluation. Please try again.");
      console.error("Submit error:", err);
    }
  };

  const evaluationQuestions = [
    { key: "communication", label: "Communication Skills", description: "How well does the employee communicate with team members and stakeholders?" },
    { key: "teamwork", label: "Teamwork", description: "How effectively does the employee collaborate with others?" },
    { key: "problemSolving", label: "Problem Solving", description: "How well does the employee identify and solve problems?" },
    { key: "leadership", label: "Leadership", description: "How well does the employee demonstrate leadership qualities?" },
    { key: "adaptability", label: "Adaptability", description: "How well does the employee adapt to changes and new situations?" },
    { key: "workQuality", label: "Work Quality", description: "How would you rate the overall quality of the employee's work?" }
  ];

  // ----- Display helpers for table -----
  const getEmployeeName = (id) => employees.find(e => Number(e.id) === Number(id))?.name || "Unknown";
  const ensureScoresObject = (scores) => {
    // Backend stores JSON; support both object and array-of-{question,score}
    if (!scores) return {};
    if (Array.isArray(scores)) {
      return scores.reduce((acc, s) => {
        const key = s.question || s.key;
        if (key) acc[key] = Number(s.score || s.value || 0);
        return acc;
      }, {});
    }
    return scores; // assume object with keys
  };

  const behavioralRows = (evaluations || [])
    .filter(ev => String(ev.type).toLowerCase() === "behavioral")
    .filter(ev => !selectedEmployee || Number(ev.employee_id) === Number(selectedEmployee))
    .map(ev => {
      const s = ensureScoresObject(ev.scores);
      const total = Number(ev.total_score ?? Object.values(s).reduce((sum, v) => sum + Number(v || 0), 0));
      const max = Number(ev.max_score ?? (Object.keys(s).length * 4));
      const pct = ev.percentage != null ? Number(ev.percentage) : (max > 0 ? (total / max) * 100 : 0);
      return {
        id: ev.id,
        employeeId: ev.employee_id,
        date: ev.date,
        scores: s,
        total,
        max,
        pct
      };
    });

  return (
    <div className="manager-behavioral">
      <header className="header">
        <h1>Behavioral Evaluation</h1>
        <Link to="/leader" className="back-btn">← Back to Dashboard</Link>
      </header>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="evaluation-form">
          <div className="employee-selection">
            <label htmlFor="employee">Select Employee to Evaluate *</label>
            <select
              id="employee"
              value={selectedEmployee}
              onChange={handleEmployeeChange}
              required
            >
              <option value="">Choose an employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.department || 'No Department'}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="evaluation-questions">
              <h3>Rate the following aspects (1-5 scale)</h3>
              
              {evaluationQuestions.map(question => (
                <div key={question.key} className="question-group">
                  <label>{question.label}</label>
                  <p className="question-description">{question.description}</p>
                  <div className="rating-options">
                    {[1, 2, 3, 4].map(rating => (
                      <label key={rating} className="rating-option">
                        <input
                          type="radio"
                          name={question.key}
                          value={rating}
                          checked={answers[question.key] === rating.toString()}
                          onChange={(e) => handleAnswerChange(question.key, e.target.value)}
                        />
                        <span className="rating-label">{rating}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {selectedEmployee && (
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                Submit Evaluation
              </button>
            </div>
          )}
        </form>
      </div>

      {/* ----- Behavioral Evaluations Table ----- */}
      <div className="results-table" style={{ marginTop: 24 }}>
        <h2>Behavioral Evaluations</h2>
        <p style={{ marginBottom: 8 }}>
          {selectedEmployee ? `Showing results for: ${getEmployeeName(selectedEmployee)}` : "Showing all behavioral evaluations"}
        </p>

        <div className="table-container">
          <table className="evaluation-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Communication</th>
                <th>Teamwork</th>
                <th>Problem Solving</th>
                <th>Leadership</th>
                <th>Adaptability</th>
                <th>Work Quality</th>
                <th>Total</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {behavioralRows.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center" }}>No behavioral evaluations found.</td>
                </tr>
              ) : (
                behavioralRows.map(r => (
                  <tr key={r.id}>
                    <td>{r.date ? new Date(r.date).toLocaleString() : ""}</td>
                    <td>{getEmployeeName(r.employeeId)}</td>
                    <td>{r.scores.communication ?? "-"}</td>
                    <td>{r.scores.teamwork ?? "-"}</td>
                    <td>{r.scores.problemSolving ?? "-"}</td>
                    <td>{r.scores.leadership ?? "-"}</td>
                    <td>{r.scores.adaptability ?? "-"}</td>
                    <td>{r.scores.workQuality ?? "-"}</td>
                    <td>{r.total}/{r.max}</td>
                    <td>{r.pct.toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManagerBehavioral;