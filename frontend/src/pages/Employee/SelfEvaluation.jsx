import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./SelfEvaluation.css";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import databaseService from "../../services/DatabaseService";

function SelfEvaluation() {
  const { employees } = useData();
  const { email } = useAuth();

  const me = employees.find((e) => e.email === email);

  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ⭐ SELF SCORES
  const [scores, setScores] = useState({
    workQuality: 4,
    communication: 3,
    teamwork: 4,
    problemSolving: 3,
    initiative: 4,
    adaptability: 3,
    leadership: 3,
    timeManagement: 4,
    ethicsCompliance: 4,
    serviceDelivery: 3,
    innovation: 3,
  });

  // ⭐ COMMENTS
  const [comments, setComments] = useState({
    achievements: "",
    challenges: "",
    goals: "",
    trainingNeeds: "",
    suggestions: "",
  });

  // ⭐ CALCULATE SELF %
  const calculateSelfPercentage = () => {
    const total = Object.values(scores).reduce((a, b) => a + Number(b), 0);
    const max = Object.keys(scores).length * 5;
    return ((total / max) * 100).toFixed(1);
  };

  const selfPercentage = calculateSelfPercentage();

  const handleScoreChange = (key, value) => {
    setScores({ ...scores, [key]: value });
  };

  const handleCommentChange = (key, value) => {
    setComments({ ...comments, [key]: value });
  };

  // ⭐ SUBMIT EVALUATION
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const evaluation = {
        employeeId: me.id,
        employeeName: me.name,
        department: me.department,
        selfScores: scores,
        comments,
        selfPercentage,
        createdAt: new Date().toISOString(),
      };

      console.log("Sending evaluation:", evaluation);

      await databaseService.storeEvaluation(evaluation);

      setSuccess("✅ Evaluation submitted successfully!");
    } catch (err) {
      console.error(err);
      setError("❌ Failed to submit evaluation");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: "workQuality", label: "Work Quality" },
    { key: "communication", label: "Communication" },
    { key: "teamwork", label: "Teamwork" },
    { key: "problemSolving", label: "Problem Solving" },
    { key: "initiative", label: "Initiative" },
    { key: "adaptability", label: "Adaptability" },
    { key: "leadership", label: "Leadership" },
    { key: "timeManagement", label: "Time Management" },
    { key: "ethicsCompliance", label: "Ethics & Compliance" },
    { key: "serviceDelivery", label: "Service Delivery" },
    { key: "innovation", label: "Innovation" },
  ];

  return (
    <div className="self-evaluation">
      <header className="header">
        <Link to="/employee" className="home-btn">⬅ Back</Link>
      </header>

      <h2>Employee Self Evaluation</h2>

      <div className="employee-info">
        <input readOnly value={me?.department || ""} />
        <input readOnly value={me?.rank || ""} />
        <input readOnly value={formattedDate} />
      </div>

      {/* ⭐ SELF SCORES TABLE */}
      <h3>Self Evaluation (1–5)</h3>
      
      <div className="evaluation-table-container">
        <table className="evaluation-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
              <th>5</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.key}>
                <td className="category-label">
                  <label>{c.label}</label>
                </td>
                {[1, 2, 3, 4, 5].map((n) => (
                  <td key={n} className="rating-cell">
                    <button
                      type="button"
                      onClick={() => handleScoreChange(c.key, n)}
                      className={`rating-btn ${scores[c.key] === n ? "selected" : ""}`}
                    >
                      {n}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Comments</h3>

      {/* Enhanced Comments Section */}
      <div className="enhanced-comments-section">
        <h3>Evaluation Comments</h3>
        <p className="comments-description">Please provide detailed comments for each section below:</p>
        
        <div className="comments-grid">
          {Object.entries(comments).map(([type, content]) => (
            <div key={type} className="comment-item">
              <label className="comment-label">
                {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
              </label>
              <textarea
                className="comment-textarea"
                placeholder={`Enter ${type.replace(/([A-Z])/g, ' $1').toLowerCase()} here...`}
                value={content}
                onChange={(e) => handleCommentChange(type, e.target.value)}
                rows={4}
              />
            </div>
          ))}
        </div>

        <div className="final-score">
          <h2>Final Self Evaluation Score: {selfPercentage}% (Weighted: {(selfPercentage * 0.05).toFixed(2)}%)</h2>
        </div>

        <button className="btn primary" onClick={handleSubmit}>
          {loading ? "Submitting..." : "Submit Self Evaluation"}
        </button>

        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}
      </div>
      </div>
  );
}

export default SelfEvaluation;