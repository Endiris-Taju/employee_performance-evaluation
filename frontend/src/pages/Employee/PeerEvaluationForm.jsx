// src/pages/PeerEvaluationForm.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./PeerEvaluationForm.css";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

function PeerEvaluationForm() {
  const { employees, submitEvaluation } = useData();
  const { email, name } = useAuth();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const me = employees.find((e) => e.email === email);
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [scores, setScores] = useState({
    workQuality: "",
    communication: "",
    teamwork: "",
    problemSolving: "",
    initiative: "",
    adaptability: "",
    leadership: "",
    timeManagement: ""
  });

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value);
    setSuccess("");
    setError("");
  };

  const handleScoreChange = (category, value) => {
    setScores({
      ...scores,
      [category]: value
    });
    setSuccess("");
    setError("");
  };

  const totalScore = Object.values(scores).reduce((sum, score) => sum + (Number(score) || 0), 0);
  const maxScore = 4; // Each category is rated 1-4
  const totalMaxScore = Object.keys(scores).length * maxScore;
  const percentage = totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 100).toFixed(1) : 0;

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!selectedEmployee) {
      setError("Please select an employee to evaluate.");
      return;
    }

    const hasEmptyScores = Object.values(scores).some(score => score === "");
    if (hasEmptyScores) {
      setError("Please complete all evaluation categories.");
      return;
    }

    try {
      await submitEvaluation({
        employee_id: parseInt(selectedEmployee),
        type: "peer",
        scores: scores,
        total_score: totalScore,
        max_score: totalMaxScore,
        percentage: percentage,
        date: new Date().toISOString()
      });

      setSuccess(`Peer Evaluation submitted successfully! Score: ${totalScore}/${totalMaxScore} (${percentage}%)`);
      
      // Reset form
      setSelectedEmployee("");
      setScores({
        workQuality: "",
        communication: "",
        teamwork: "",
        problemSolving: "",
        initiative: "",
        adaptability: "",
        leadership: "",
        timeManagement: ""
      });

    } catch (err) {
      setError("Failed to save evaluation. Please try again.");
      console.error("Submit error:", err);
    }
  };

  const evaluationCategories = [
    { key: "workQuality", label: "Work Quality", description: "Quality of work output and attention to detail" },
    { key: "communication", label: "Communication", description: "Effectiveness in verbal and written communication" },
    { key: "teamwork", label: "Teamwork", description: "Collaboration and cooperation with team members" },
    { key: "problemSolving", label: "Problem Solving", description: "Ability to identify and solve problems effectively" },
    { key: "initiative", label: "Initiative", description: "Proactive approach and self-motivation" },
    { key: "adaptability", label: "Adaptability", description: "Flexibility and ability to adapt to changes" },
    { key: "leadership", label: "Leadership", description: "Leadership qualities and influence on others" },
    { key: "timeManagement", label: "Time Management", description: "Efficiency in managing time and meeting deadlines" }
  ];

  return (
    <div className="peer-evaluation-form">
      <header className="header">
        <img src={logo} alt="logo" className="form-logo" />
        <Link to="/employee" className="home-btn">
          Back to Dashboard
        </Link>
      </header>

      <h2>ADAMA SCIENCE AND TECHNOLOGY UNIVERSITY</h2>
      <h4>Peer Evaluation (Scale 1-4, Max Score: {totalMaxScore})</h4>

      <div className="employee-info">
        <label>
          Select Employee to Evaluate:
          <select
            value={selectedEmployee}
            onChange={handleEmployeeChange}
            required
          >
            <option value="">-- Select Employee --</option>
            {employees.filter(emp => emp.id !== me?.id).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} - {emp.department || 'No Department'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Evaluator:
          <input type="text" readOnly value={me?.name || name || ""} />
        </label>
        <label>
          Date of Evaluation:
          <input type="text" readOnly value={formattedDate} />
        </label>
      </div>

      {selectedEmployee && (
        <div className="evaluation-categories">
          <h3>Rate the selected employee on the following categories (1-{maxScore} scale):</h3>
          
          {evaluationCategories.map(category => (
            <div key={category.key} className="category-group">
              <label className="category-label">{category.label}</label>
              <p className="category-description">{category.description}</p>
              <div className="rating-options">
                {Array.from({ length: maxScore }, (_, i) => i + 1).map(rating => (
                  <label key={rating} className="rating-option">
                    <input
                      type="radio"
                      name={category.key}
                      value={rating}
                      checked={scores[category.key] === rating.toString()}
                      onChange={(e) => handleScoreChange(category.key, e.target.value)}
                    />
                    <span className="rating-label">{rating}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEmployee && (
        <div className="results">
          <label>
            Total Score:
            <input type="text" readOnly value={`${totalScore}/${totalMaxScore}`} />
          </label>
          <label>
            Percentage:
            <input type="text" readOnly value={`${percentage}%`} />
          </label>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {selectedEmployee && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button className="btn primary" onClick={handleSubmit}>
            Submit Peer Evaluation
          </button>
        </div>
      )}
    </div>
  );
}

export default PeerEvaluationForm;
