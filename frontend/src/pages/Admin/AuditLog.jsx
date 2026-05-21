import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PageShell from "../../components/layout/PageShell";
import { apiFetch } from "../../services/api";

export default function AuditLog() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/audit?limit=200", { token });
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <PageShell
      title="Audit log"
      subtitle="Recent security and data changes"
      backTo="/admin"
    >
      {err && (
        <div className="card">
          <p className="error" style={{ margin: 0 }}>{err}</p>
        </div>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No audit entries yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border)" }}>
                <th style={{ padding: 8 }}>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td>
                    {r.user_name || "—"}
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                      {r.user_email || ""}
                    </div>
                  </td>
                  <td>
                    <span className="badge-modern">{r.action}</span>
                  </td>
                  <td>
                    {r.entity_type || "—"}
                    {r.entity_id ? ` #${r.entity_id}` : ""}
                  </td>
                  <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.details
                      ? typeof r.details === "object"
                        ? JSON.stringify(r.details)
                        : String(r.details)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
