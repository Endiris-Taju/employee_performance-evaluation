import React, { useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import PageShell from "../../components/layout/PageShell";
import { filterTeamMembers, getEmployeeName } from "../../utils/evaluationHelpers";

const QUESTIONS = [
  { key: "communication", label: "Communication" },
  { key: "teamwork", label: "Teamwork" },
  { key: "problemSolving", label: "Problem solving" },
  { key: "leadership", label: "Leadership" },
  { key: "adaptability", label: "Adaptability" },
  { key: "workQuality", label: "Work quality" },
];

const MAX_PER_QUESTION = 4;

function ManagerBehavioral() {
  const { employees, teams, evaluations, submitBehavioral, fetchEvaluations } = useData();
  const { userId } = useAuth();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [answers, setAnswers] = useState(
    Object.fromEntries(QUESTIONS.map((q) => [q.key, ""]))
  );

  const roster = useMemo(
    () => filterTeamMembers(employees, teams, userId),
    [employees, teams, userId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedEmployee) {
      setError("Select an employee to evaluate.");
      return;
    }
    if (Object.values(answers).some((v) => v === "")) {
      setError("Complete all rating categories (1–4).");
      return;
    }
    const totalScore = Object.values(answers).reduce((s, v) => s + Number(v), 0);
    const maxScore = QUESTIONS.length * MAX_PER_QUESTION;
    try {
      setSubmitting(true);
      await submitBehavioral({
        employeeId: Number(selectedEmployee),
        evaluatorId: Number(userId),
        scores: Object.fromEntries(
          QUESTIONS.map((q) => [q.key, Number(answers[q.key])])
        ),
        totalScore,
        maxScore,
        percentage: Number(((totalScore / maxScore) * 100).toFixed(1)),
      });
      await fetchEvaluations?.();
      setSuccess(
        `Behavioral evaluation saved for ${getEmployeeName(employees, selectedEmployee)}.`
      );
      setSelectedEmployee("");
      setAnswers(Object.fromEntries(QUESTIONS.map((q) => [q.key, ""])));
    } catch (err) {
      setError(err.message || "Failed to save evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  const behavioralRows = (evaluations || [])
    .filter((ev) => ev.type === "behavioral")
    .filter(
      (ev) =>
        !selectedEmployee || Number(ev.employee_id) === Number(selectedEmployee)
    )
    .filter((ev) =>
      roster.some((m) => Number(m.id) === Number(ev.employee_id))
    );

  return (
    <PageShell
      title="Behavioral review"
      subtitle="Leader evaluation of team behavior (15% weight). Rate each category 1–4."
      backTo="/leader"
      wide
    >
      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <form onSubmit={handleSubmit} className="stack">
        <div className="card">
          <div className="form-field">
            <label>Team member *</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              required
            >
              <option value="">Select employee…</option>
              {roster.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.department || "—"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedEmployee && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Ratings (1–4)</h3>
            {QUESTIONS.map((q) => (
              <div
                key={q.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <span style={{ fontWeight: 500 }}>{q.label}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`btn sm ${answers[q.key] === String(n) ? "primary" : ""}`}
                      onClick={() =>
                        setAnswers({ ...answers, [q.key]: String(n) })
                      }
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          className="btn primary"
          disabled={submitting || !selectedEmployee}
        >
          {submitting ? "Submitting…" : "Submit behavioral evaluation"}
        </button>
      </form>

      <section style={{ marginTop: 32 }}>
        <h2 className="section-title">Submitted behavioral evaluations</h2>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Total</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {behavioralRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)" }}>
                    No behavioral evaluations yet.
                  </td>
                </tr>
              ) : (
                behavioralRows.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.date ? new Date(ev.date).toLocaleDateString() : "—"}</td>
                    <td>{getEmployeeName(employees, ev.employee_id)}</td>
                    <td>
                      {ev.total_score} / {ev.max_score}
                    </td>
                    <td>{Number(ev.percentage || 0).toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}

export default ManagerBehavioral;
