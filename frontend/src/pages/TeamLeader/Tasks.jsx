import React, { useState, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import PageShell from "../../components/layout/PageShell";
import { filterTeamMembers } from "../../utils/evaluationHelpers";

const TASK_ROWS = 6;

function Tasks() {
  const { employees, teams, saveWorkRateEvaluation, fetchEvaluations } = useData();
  const { userId } = useAuth();

  const roster = useMemo(
    () => filterTeamMembers(employees, teams, userId),
    [employees, teams, userId]
  );

  const emptyTasks = () =>
    Array(TASK_ROWS)
      .fill(null)
      .map(() => ({ task: "", percent: "", rank: "" }));

  const [employeeId, setEmployeeId] = useState("");
  const [tasks, setTasks] = useState(emptyTasks());
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selected = roster.find((e) => String(e.id) === String(employeeId));

  const handleTaskChange = (index, field, value) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
    setSuccess("");
    setError("");
  };

  const filledTasks = tasks.filter((t) => t.task && t.percent && t.rank);
  const totalPercent = filledTasks.reduce((s, t) => s + Number(t.percent || 0), 0);
  const totalScore = filledTasks.reduce(
    (sum, t) => sum + (Number(t.percent || 0) / 100) * 70 * (Number(t.rank || 0) / 4),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!employeeId) {
      setError("Select a team member to evaluate.");
      return;
    }
    if (Math.round(totalPercent) !== 100) {
      setError("Task percentages must total 100%.");
      return;
    }
    if (filledTasks.length === 0) {
      setError("Add at least one task with percent and rank.");
      return;
    }
    try {
      setSubmitting(true);
      await saveWorkRateEvaluation({
        employeeId: Number(employeeId),
        tasks: filledTasks,
        totalScore,
        maxScore: 70,
        percentage: Number(((totalScore / 70) * 100).toFixed(1)),
      });
      await fetchEvaluations?.();
      setSuccess(`Work rate evaluation saved. Score: ${totalScore.toFixed(2)} / 70`);
      setTasks(emptyTasks());
      setEmployeeId("");
    } catch (err) {
      setError(err.message || "Failed to save evaluation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Work rate evaluation"
      subtitle="Evaluate assigned tasks (out of 70). Task weights must total 100%. Rank each task 1–4."
      backTo="/leader"
      wide
    >
      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="grid grid-2">
            <div className="form-field">
              <label>Employee *</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              >
                <option value="">Select team member…</option>
                {roster.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.department || "—"}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Date</label>
              <input readOnly value={new Date().toLocaleDateString()} />
            </div>
          </div>
          {selected && (
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
              {selected.department || "No department"} · {selected.rank || selected.position || "—"}
            </p>
          )}
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Task description</th>
                <th>Weight %</th>
                <th>Rank (1–4)</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="text"
                      value={t.task}
                      placeholder="Describe the task"
                      onChange={(e) => handleTaskChange(index, "task", e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={t.percent}
                      onChange={(e) => handleTaskChange(index, "percent", e.target.value)}
                      style={{ width: 80 }}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1, 2, 3, 4].map((rank) => (
                        <button
                          key={rank}
                          type="button"
                          className={`btn sm ${t.rank === String(rank) ? "primary" : ""}`}
                          onClick={() => handleTaskChange(index, "rank", String(rank))}
                        >
                          {rank}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    {t.percent && t.rank
                      ? ((Number(t.percent) / 100) * 70 * (Number(t.rank) / 4)).toFixed(2)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card card--flat">
          <div className="grid grid-3">
            <div>
              <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>Total weight</span>
              <p style={{ margin: "4px 0 0", fontWeight: 700 }}>{totalPercent}% / 100%</p>
            </div>
            <div>
              <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>Total score</span>
              <p style={{ margin: "4px 0 0", fontWeight: 700 }}>{totalScore.toFixed(2)} / 70</p>
            </div>
            <div>
              <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>Percentage</span>
              <p style={{ margin: "4px 0 0", fontWeight: 700 }}>
                {((totalScore / 70) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? "Saving…" : "Submit work rate evaluation"}
        </button>
      </form>
    </PageShell>
  );
}

export default Tasks;
