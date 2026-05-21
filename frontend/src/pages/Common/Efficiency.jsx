import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import PageShell from "../../components/layout/PageShell";
import StatCard from "../../components/ui/StatCard";
import { filterTeamMembers } from "../../utils/evaluationHelpers";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Efficiency() {
  const { token, role, userId, email } = useAuth();
  const { employees, teams } = useData();

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const myEmployeeId =
    Number(userId) ||
    Number(employees.find((e) => String(e.email).toLowerCase() === String(email).toLowerCase())?.id);

  const roster =
    role === "leader"
      ? filterTeamMembers(employees, teams, userId)
      : role === "admin"
        ? employees.filter((e) => ["member", "employee", "leader"].includes(e.role))
        : employees.filter((e) => Number(e.id) === myEmployeeId);

  const [selectedId, setSelectedId] = useState(
    role === "admin" || role === "leader" ? "" : String(myEmployeeId || "")
  );
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const canPickEmployee = role === "admin" || role === "leader";

  const load = async (id) => {
    setErr("");
    setData(null);
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/efficiency/employee/${id}`, { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load efficiency");
      setData(json);
    } catch (e) {
      setErr(e.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = canPickEmployee ? selectedId : myEmployeeId;
    if (id) load(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, token, myEmployeeId]);

  useEffect(() => {
    if (!canPickEmployee && myEmployeeId) setSelectedId(String(myEmployeeId));
  }, [canPickEmployee, myEmployeeId]);

  const backPath =
    role === "admin" ? "/admin" : role === "leader" ? "/leader" : "/employee";

  const weights = data?.weights || { self: 5, peer: 10, leader: 15, admin: 70 };
  const breakdown = data?.breakdown_percent || {};

  return (
    <PageShell
      title="Efficiency scores"
      subtitle="Weighted overall score: Self 5% + Peer 10% + Leader 15% + Work rate 70%"
      backTo={backPath}
      actions={
        canPickEmployee ? (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ minWidth: 260 }}
          >
            <option value="">Select employee…</option>
            {roster.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.department || "No dept"})
              </option>
            ))}
          </select>
        ) : (
          <button type="button" className="btn" onClick={() => load(myEmployeeId)} disabled={loading}>
            Refresh
          </button>
        )
      }
      wide
    >
      {err && <div className="alert alert--error">{err}</div>}

      {loading && <p style={{ color: "var(--muted)" }}>Loading efficiency data…</p>}

      {data && (
        <>
          <div className="grid grid-4">
            <StatCard
              label="Overall efficiency"
              value={`${data.efficiency_percent}%`}
              variant="success"
            />
            <StatCard
              label={`Self (${weights.self}%)`}
              value={breakdown.self != null ? `${breakdown.self}%` : "Missing"}
              variant={breakdown.self != null ? "default" : "warning"}
            />
            <StatCard
              label={`Peer (${weights.peer}%)`}
              value={breakdown.peer != null ? `${breakdown.peer}%` : "Missing"}
              variant={breakdown.peer != null ? "default" : "warning"}
            />
            <StatCard
              label={`Leader (${weights.leader}%)`}
              value={breakdown.leader != null ? `${breakdown.leader}%` : "Missing"}
              variant={breakdown.leader != null ? "default" : "warning"}
            />
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>How this is calculated</h3>
            <p style={{ color: "var(--text-secondary)", marginTop: 0 }}>
              Each bucket uses the <strong>latest</strong> evaluation percentage for that type, then
              applies the weight above.
            </p>
            <div className="data-table-wrap" style={{ marginTop: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Weight</th>
                    <th>Latest %</th>
                    <th>Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "self", label: "Self evaluation", w: weights.self },
                    { key: "peer", label: "Peer evaluation", w: weights.peer },
                    { key: "leader", label: "Leader behavioral", w: weights.leader },
                    { key: "admin", label: "Work rate / admin", w: weights.admin },
                  ].map((row) => {
                    const pct = breakdown[row.key];
                    const contrib =
                      pct != null ? ((pct * row.w) / 100).toFixed(2) : "—";
                    return (
                      <tr key={row.key}>
                        <td>{row.label}</td>
                        <td>{row.w}%</td>
                        <td>{pct != null ? `${pct}%` : "—"}</td>
                        <td>{contrib !== "—" ? `${contrib}%` : "—"}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan={3}>
                      <strong>Total efficiency</strong>
                    </td>
                    <td>
                      <strong>{data.efficiency_percent}%</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!data && !loading && !err && canPickEmployee && (
        <p style={{ color: "var(--muted)" }}>Select an employee to view their efficiency breakdown.</p>
      )}
    </PageShell>
  );
}
