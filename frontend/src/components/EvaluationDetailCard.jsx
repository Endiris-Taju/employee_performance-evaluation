import React, { useState } from "react";
import {
  formatEvalType,
  getEmployeeName,
  getEvaluatorName,
  parseScores,
  EVAL_WEIGHTS,
} from "../utils/evaluationHelpers";

export default function EvaluationDetailCard({ evaluation, employees, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!evaluation) return null;

  const scores = parseScores(evaluation.scores);
  const comments = scores.comments || {};
  const scoreEntries = Object.entries(scores).filter(([k]) => k !== "comments");
  const tasks = evaluation.tasks;
  const parsedTasks = Array.isArray(tasks)
    ? tasks
    : typeof tasks === "string"
      ? (() => {
          try {
            return JSON.parse(tasks);
          } catch {
            return [];
          }
        })()
      : [];

  const weight = EVAL_WEIGHTS[evaluation.type] ?? "—";

  return (
    <div className="card card--flat" style={{ marginBottom: 12 }}>
      <button
        type="button"
        className="eval-detail-header"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          padding: 0,
          border: "none",
          background: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          color: "inherit",
        }}
      >
        <div>
          <span className={`badge eval-type-${evaluation.type}`}>
            {formatEvalType(evaluation.type)}
          </span>
          <strong style={{ display: "block", marginTop: 6 }}>
            {getEmployeeName(employees, evaluation.employee_id)}
          </strong>
          <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            {evaluation.date
              ? new Date(evaluation.date).toLocaleString()
              : "—"}
            {evaluation.type === "peer" && (
              <> · Evaluator: {getEvaluatorName(employees, evaluation)}</>
            )}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>
            {Number(evaluation.total_score || 0).toFixed(1)} / {evaluation.max_score ?? "—"}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            {Number(evaluation.percentage || 0).toFixed(1)}% · weight {weight}%
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--primary)" }}>
            {open ? "Hide details" : "View details"}
          </span>
        </div>
      </button>

      {open && (
        <div className="eval-detail-body" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          {parsedTasks.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 8px" }}>Tasks</h4>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Weight %</th>
                      <th>Rank (1–4)</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedTasks.map((t, i) => (
                      <tr key={i}>
                        <td>{t.task || t.name || "—"}</td>
                        <td>{t.percent ?? t.weight ?? "—"}%</td>
                        <td>{t.rank ?? "—"}</td>
                        <td>
                          {t.percent && t.rank
                            ? (
                                ((Number(t.percent) / 100) *
                                  70 *
                                  (Number(t.rank) / 4))
                              ).toFixed(2)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {scoreEntries.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ margin: "0 0 8px" }}>Scores</h4>
              <div className="grid grid-2">
                {scoreEntries.map(([key, val]) => (
                  <div key={key} className="card card--flat" style={{ padding: 12 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "capitalize" }}>
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <div style={{ fontWeight: 700, marginTop: 4 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(comments).length > 0 && (
            <div>
              <h4 style={{ margin: "0 0 8px" }}>Comments</h4>
              {Object.entries(comments).map(([key, text]) =>
                text ? (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <strong style={{ textTransform: "capitalize" }}>
                      {key.replace(/([A-Z])/g, " $1")}:
                    </strong>
                    <p style={{ margin: "4px 0 0", color: "var(--text-secondary)" }}>{text}</p>
                  </div>
                ) : null
              )}
            </div>
          )}

          {scoreEntries.length === 0 && parsedTasks.length === 0 && (
            <p style={{ color: "var(--muted)", margin: 0 }}>No detailed breakdown stored.</p>
          )}
        </div>
      )}
    </div>
  );
}
