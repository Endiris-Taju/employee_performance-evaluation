import React, { useState } from "react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import PageShell from "../../components/layout/PageShell";

const CATEGORIES = [
  { key: "workQuality", label: "Work quality" },
  { key: "communication", label: "Communication" },
  { key: "teamwork", label: "Teamwork" },
  { key: "problemSolving", label: "Problem solving" },
  { key: "initiative", label: "Initiative" },
  { key: "adaptability", label: "Adaptability" },
  { key: "leadership", label: "Leadership" },
  { key: "timeManagement", label: "Time management" },
  { key: "ethicsCompliance", label: "Ethics & compliance" },
  { key: "serviceDelivery", label: "Service delivery" },
  { key: "innovation", label: "Innovation" },
];

const DEFAULT_SCORES = Object.fromEntries(CATEGORIES.map((c) => [c.key, 3]));

function SelfEvaluation() {
  const { employees, saveSelfEvaluation } = useData();
  const { email, userId, role } = useAuth();

  const me =
    employees.find((e) => e.email === email) ||
    employees.find((e) => String(e.id) === String(userId));

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [scores, setScores] = useState(DEFAULT_SCORES);
  const [comments, setComments] = useState({
    achievements: "",
    challenges: "",
    goals: "",
    trainingNeeds: "",
    suggestions: "",
  });

  const totalScore = Object.values(scores).reduce((a, b) => a + Number(b), 0);
  const maxScore = CATEGORIES.length * 5;
  const selfPercentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : 0;

  const backPath =
    role === "admin" ? "/admin" : role === "leader" ? "/leader" : "/employee";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!me?.id) {
      setError("Profile not found. Please sign in again.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await saveSelfEvaluation({
        employeeId: me.id,
        scores,
        comments,
        totalScore,
        maxScore,
        percentage: Number(selfPercentage),
      });
      setSuccess("Self evaluation submitted successfully.");
    } catch (err) {
      setError(err.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Self evaluation"
      subtitle="Rate yourself on each category (1–5). Contributes 5% to your overall efficiency score."
      backTo={backPath}
    >
      <div className="card card--flat">
        <div className="grid grid-3">
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Name</span>
            <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{me?.name || "—"}</p>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Department</span>
            <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{me?.department || "—"}</p>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Date</span>
            <p style={{ margin: "4px 0 0", fontWeight: 600 }}>
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Ratings (1 = low, 5 = high)</h3>
          <div className="stack">
            {CATEGORIES.map((c) => (
              <div
                key={c.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontWeight: 500, minWidth: 160 }}>{c.label}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`btn sm ${scores[c.key] === n ? "primary" : ""}`}
                      onClick={() => setScores({ ...scores, [c.key]: n })}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16, fontSize: "1.125rem" }}>
            Score: <strong>{selfPercentage}%</strong> ({totalScore} / {maxScore}) · 5% weight
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Comments</h3>
          <div className="grid grid-2">
            {Object.entries(comments).map(([key, val]) => (
              <div key={key} className="form-field">
                <label style={{ textTransform: "capitalize" }}>
                  {key.replace(/([A-Z])/g, " $1")}
                </label>
                <textarea
                  rows={3}
                  value={val}
                  onChange={(e) => setComments({ ...comments, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? "Submitting…" : "Submit self evaluation"}
        </button>
      </form>
    </PageShell>
  );
}

export default SelfEvaluation;
