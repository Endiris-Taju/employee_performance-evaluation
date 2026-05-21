import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import PageShell from "../../components/layout/PageShell";
import StatCard from "../../components/ui/StatCard";
import EvaluationDetailCard from "../../components/EvaluationDetailCard";
import { apiFetch } from "../../services/api";

const EmployeeReports = () => {
  const { employees, evaluations } = useData();
  const { token, email, userId } = useAuth();
  const me =
    employees.find((e) => e.email === email) ||
    employees.find((e) => String(e.id) === String(userId));

  const myEvaluations = useMemo(
    () =>
      (evaluations || []).filter(
        (ev) => Number(ev.employee_id) === Number(me?.id)
      ),
    [evaluations, me?.id]
  );

  const [efficiency, setEfficiency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token || !me?.id) return;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await apiFetch(`/efficiency/employee/${me.id}`, { token });
        setEfficiency(data);
      } catch (e) {
        setErr(e.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, me?.id]);

  const byType = useMemo(() => {
    const map = {};
    for (const ev of myEvaluations) {
      const t = ev.type;
      if (!map[t] || new Date(ev.date) > new Date(map[t].date)) map[t] = ev;
    }
    return map;
  }, [myEvaluations]);

  if (!me) {
    return (
      <PageShell title="My reports" backTo="/employee">
        <div className="alert alert--error">Profile not found. Please sign in again.</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="My performance report"
      subtitle="Your efficiency score and full evaluation history."
      backTo="/employee"
    >
      {err && <div className="alert alert--error">{err}</div>}

      <div className="grid grid-4">
        <StatCard
          label="Overall efficiency"
          value={loading ? "…" : efficiency ? `${efficiency.efficiency_percent}%` : "—"}
          variant="success"
        />
        <StatCard
          label="Self (5%)"
          value={
            efficiency?.breakdown_percent?.self != null
              ? `${efficiency.breakdown_percent.self}%`
              : "—"
          }
        />
        <StatCard
          label="Peer (10%)"
          value={
            efficiency?.breakdown_percent?.peer != null
              ? `${efficiency.breakdown_percent.peer}%`
              : "—"
          }
        />
        <StatCard
          label="Leader + work"
          value={
            efficiency?.breakdown_percent?.leader != null ||
            efficiency?.breakdown_percent?.admin != null
              ? `${efficiency.breakdown_percent.leader ?? "—"} / ${efficiency.breakdown_percent.admin ?? "—"}`
              : "—"
          }
        />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Latest by type</h3>
        <ul className="checklist">
          {["self", "peer", "behavioral", "workrate"].map((type) => {
            const ev = byType[type];
            return (
              <li key={type}>
                <span style={{ textTransform: "capitalize" }}>{type}</span>
                <span>
                  {ev
                    ? `${Number(ev.percentage || 0).toFixed(1)}% · ${new Date(ev.date).toLocaleDateString()}`
                    : "Not submitted"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <section>
        <h2 className="section-title">Full evaluation detail</h2>
        {myEvaluations.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            No evaluations on file yet. Complete self and peer evaluations from your dashboard.
          </p>
        ) : (
          myEvaluations.map((ev) => (
            <EvaluationDetailCard
              key={ev.id}
              evaluation={ev}
              employees={employees}
            />
          ))
        )}
      </section>
    </PageShell>
  );
};

export default EmployeeReports;
