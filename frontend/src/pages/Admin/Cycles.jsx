import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Cycles() {
  const { token } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const load = async () => {
    const [allRes, activeRes] = await Promise.all([
      fetch(`${API_URL}/cycles`, { headers }),
      fetch(`${API_URL}/cycles/active`, { headers }),
    ]);
    if (allRes.ok) setCycles(await allRes.json());
    if (activeRes.ok) setActive(await activeRes.json());
  };

  useEffect(() => {
    if (token) load().catch(console.error);
  }, [token]);

  const createCycle = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      const res = await fetch(`${API_URL}/cycles`, {
        method: "POST",
        headers,
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to create cycle");
      setMsg(`Created cycle: ${json.name}`);
      setForm({ name: "", start_date: "", end_date: "" });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const closeCycle = async (id) => {
    setMsg("");
    setErr("");
    try {
      const res = await fetch(`${API_URL}/cycles/${id}/close`, {
        method: "PUT",
        headers,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to close cycle");
      setMsg("Cycle closed.");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Evaluation cycles</h2>
        {active ? (
          <p style={{ color: "var(--muted)" }}>
            Active: <strong>{active.name}</strong> ({active.start_date} → {active.end_date})
          </p>
        ) : (
          <p style={{ color: "var(--muted)" }}>No active cycle.</p>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Create new cycle</h3>
        <form onSubmit={createCycle} style={{ display: "grid", gap: 12, maxWidth: 400 }}>
          <input
            placeholder="Name (e.g. Q2 2026)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            required
          />
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            required
          />
          <button type="submit" className="btn primary">
            Create cycle
          </button>
        </form>
        {msg && <p className="success" style={{ marginTop: 12 }}>{msg}</p>}
        {err && <p className="error" style={{ marginTop: 12 }}>{err}</p>}
      </div>

      <div className="card">
        <h3>All cycles</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border, #ddd)" }}>
              <th style={{ padding: 8 }}>Name</th>
              <th>Period</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cycles.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border, #eee)" }}>
                <td style={{ padding: 8 }}>{c.name}</td>
                <td>
                  {c.start_date} → {c.end_date}
                </td>
                <td>{c.status}</td>
                <td>
                  {c.status === "open" && (
                    <button type="button" className="btn" onClick={() => closeCycle(c.id)}>
                      Close
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
