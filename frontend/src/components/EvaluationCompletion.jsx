import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function EvaluationCompletion({ compact = false }) {
  const { token, role } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isStaff = role === "admin" || role === "leader";

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_URL}/evaluations/completion`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to load completion status");
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="card">
        <p style={{ color: "var(--muted)", margin: 0 }}>Loading evaluation status…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>
      </div>
    );
  }

  if (!data?.cycle) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Evaluation period</h3>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          No active evaluation cycle. Ask an admin to open one.
        </p>
      </div>
    );
  }

  const { cycle, summary, employees, myStatus } = data;

  if (!isStaff && myStatus) {
    const items = [
      { key: "self", label: "Self evaluation (5%)", done: myStatus.self, to: "/self-evaluation" },
      { key: "peer", label: "Peer feedback given", done: myStatus.peerGiven, to: "/peerEvaluation" },
      { key: "received", label: "Peer review received", done: myStatus.peerReceived, to: null },
      { key: "leader", label: "Leader evaluation (15%)", done: myStatus.leader, to: null },
      { key: "admin", label: "Admin / work rate (70%)", done: myStatus.admin, to: null },
    ];

    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{cycle.name}</h3>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          {cycle.start_date} → {cycle.end_date}
        </p>
        <ul className="checklist">
          {items.map((item) => (
            <li key={item.key}>
              <span>
                {item.done ? "✓" : "○"} {item.label}
              </span>
              {item.to && !item.done && (
                <Link to={item.to} className="btn sm">
                  Complete
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{cycle.name}</h3>
        <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
          Self: {summary.selfDone}/{summary.total} · Fully complete: {summary.fullyComplete}/
          {summary.total}
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Evaluation completion — {cycle.name}</h3>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        {cycle.start_date} → {cycle.end_date} · Self done: {summary.selfDone}/{summary.total} ·
        Fully complete: {summary.fullyComplete}/{summary.total}
      </p>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Self</th>
              <th>Peer</th>
              <th>Leader</th>
              <th>Admin</th>
              <th>Done</th>
            </tr>
          </thead>
          <tbody>
            {employees.slice(0, compact ? 5 : 50).map((e) => (
              <tr key={e.id}>
                <td>
                  {e.name}
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{e.department || "—"}</div>
                </td>
                <td>{e.self ? "✓" : "—"}</td>
                <td>{e.peerReceived ? "✓" : "—"}</td>
                <td>{e.leader ? "✓" : "—"}</td>
                <td>{e.admin ? "✓" : "—"}</td>
                <td>{e.complete ? <span className="badge badge--success">Yes</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
