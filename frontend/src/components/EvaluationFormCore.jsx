// src/components/EvaluationFormCore.jsx
import React, { useState } from "react";

const CRITERIA = [
  { key: "punctuality", label: "Punctuality" },
  { key: "teamwork", label: "Teamwork" },
  { key: "creativity", label: "Creativity" },
  { key: "communication", label: "Communication" },
  { key: "problemSolving", label: "Problem Solving" },
];

export default function EvaluationFormCore({
  employee,
  onSubmit,
  evaluatorType, // "performance" or "peer"
}) {
  const [scores, setScores] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const totalScore = Object.values(scores).reduce(
    (sum, val) => sum + (parseInt(val) || 0),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employee) return;

    onSubmit({
      employeeId: employee.id,
      evaluatorType,
      scores,
      totalScore,
    });

    setSubmitted(true);
  };

  if (!employee) {
    return <p style={{ marginTop: 16 }}>⚠️ Please select an employee first.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginTop: 16 }}>
      <h3>
        Evaluating: {employee.name} ({employee.rank})
      </h3>
      <p>
        Department: <strong>{employee.department}</strong>
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {CRITERIA.map((c) => (
          <label key={c.key}>
            {c.label}
            <input
              type="number"
              min="1"
              max="10"
              value={scores[c.key] || ""}
              onChange={(e) =>
                setScores({ ...scores, [c.key]: e.target.value })
              }
            />
          </label>
        ))}
      </div>

      <p style={{ marginTop: 12 }}>
        <strong>Total Score:</strong> {totalScore}
      </p>

      <button className="btn primary" type="submit">
        Submit Evaluation
      </button>

      {submitted && (
        <div style={{ marginTop: 16, color: "green" }}>
          ✅ Evaluation submitted successfully. <br />
          Final Score: <strong>{totalScore}</strong>
        </div>
      )}
    </form>
  );
}
