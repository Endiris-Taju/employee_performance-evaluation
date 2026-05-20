import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Efficiency() {
  const { token, role, userId, email } = useAuth();
  const { employees } = useData();

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

  const [selectedId, setSelectedId] = useState(myEmployeeId || "");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  const canPickEmployee = role === "admin" || role === "leader";

  const load = async (id) => {
    setErr("");
    setData(null);
    try {
      if (!id) throw new Error("Missing employee id");
      const res = await fetch(`${API_URL}/efficiency/employee/${id}`, { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load efficiency");
      setData(json);
    } catch (e) {
      setErr(e.message || "Failed to load.");
    }
  };

  useEffect(() => {
    if (selectedId) load(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, token]);

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Employee Efficiency</h2>
            <p style={{ marginTop: 6, marginBottom: 0, color: "var(--muted)" }}>
              Weighted score: Self 5% + Peer 10% + Leader 15% + Admin/Work 70%.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {canPickEmployee && (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{ minWidth: 260 }}
              >
                <option value="">Select employee…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.department || "No dept"})
                  </option>
                ))}
              </select>
            )}
            {!canPickEmployee && (
              <button className="btn" onClick={() => load(selectedId)} disabled={!selectedId}>
                Refresh
              </button>
            )}
          </div>
        </div>

        {err && (
          <div style={{ marginTop: 16, color: "#ef4444" }}>
            {err}
          </div>
        )}

        {data && (
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card" style={{ boxShadow: "none" }}>
              <h3 style={{ marginTop: 0 }}>Overall</h3>
              <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
                {data.efficiency_percent}%
              </div>
              <p style={{ marginTop: 8, marginBottom: 0, color: "var(--muted)" }}>
                Uses the latest evaluation available in each bucket.
              </p>
            </div>

            <div className="card" style={{ boxShadow: "none" }}>
              <h3 style={{ marginTop: 0 }}>Breakdown (latest %)</h3>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text)" }}>
                <li>Self (5%): {data.breakdown_percent?.self ?? "—"}%</li>
                <li>Peer (10%): {data.breakdown_percent?.peer ?? "—"}%</li>
                <li>Leader (15%): {data.breakdown_percent?.leader ?? "—"}%</li>
                <li>Admin/Work (70%): {data.breakdown_percent?.admin ?? "—"}%</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

