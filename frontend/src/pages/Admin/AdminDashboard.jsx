import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiTrendingUp,
  FiAward,
  FiRefreshCw,
  FiUserPlus,
} from "react-icons/fi";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import EvaluationCompletion from "../../components/EvaluationCompletion";
import PageShell from "../../components/layout/PageShell";
import StatCard from "../../components/ui/StatCard";
import ActionCard from "../../components/ui/ActionCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AdminDashboard() {
  const { employees, evaluations } = useData();
  const { token } = useAuth();
  const navigate = useNavigate();

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentCount: 0,
    absentCount: 0,
    avgPerformance: 0,
    topPerformer: "N/A",
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [employees, evaluations, token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const memberCount =
        employees?.filter((e) => ["member", "employee"].includes(e.role)).length ||
        employees?.length ||
        0;

      let presentCount = 0;
      if (token) {
        const attRes = await fetch(
          `${API_URL}/attendance?from=${new Date().toISOString().split("T")[0]}T00:00:00Z`,
          { headers }
        );

        if (attRes.ok) {
          const att = await attRes.json();
          const today = new Date().toISOString().split("T")[0];
          const todayCheckins = (Array.isArray(att) ? att : []).filter(
            (r) =>
              r.event_type === "checkin" &&
              r.event_time &&
              String(r.event_time).startsWith(today)
          );
          presentCount = new Set(todayCheckins.map((r) => r.employee_id)).size;
        }

      }

      const evals = evaluations || [];
      const avgPerformance =
        evals.length > 0
          ? Math.round(
              evals.reduce((s, e) => s + Number(e.percentage || 0), 0) / evals.length
            )
          : 0;

      const topPerformerEval = evals.reduce((top, e) => {
        const score = Number(e.percentage || 0);
        const topScore = Number(top?.percentage || 0);
        return score > topScore ? e : top;
      }, null);
      const topEmployee = topPerformerEval
        ? employees.find((emp) => emp.id === topPerformerEval.employee_id)
        : null;

      const activities = [
        ...evals.slice(0, 3).map((e) => {
          const emp = employees.find((x) => x.id === e.employee_id);
          return {
            text: `${emp?.name || "Employee"} — ${e.type} evaluation`,
            time: new Date(e.date || e.created_at).toLocaleString(),
          };
        }),
      ].slice(0, 4);

      setStats({
        totalEmployees: memberCount,
        presentCount,
        absentCount: Math.max(0, memberCount - presentCount),
        avgPerformance,
        topPerformer: topEmployee?.name || "N/A",
      });
      setRecentActivity(activities);
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      setStats({
        totalEmployees: employees?.length || 0,
        presentCount: 0,
        absentCount: employees?.length || 0,
        avgPerformance: 0,
        topPerformer: "N/A",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Admin dashboard"
      subtitle="Organization overview, attendance, and evaluation progress."
      actions={
        <>
          <button
            type="button"
            className="btn"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <FiRefreshCw /> {loading ? "Loading…" : "Refresh"}
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => navigate("/addEmployee")}
          >
            <FiUserPlus /> Add employee
          </button>
        </>
      }
    >
      <div className="grid grid-4">
        <StatCard
          label="Total employees"
          value={loading ? "…" : stats.totalEmployees}
          icon={FiUsers}
        />
        <StatCard
          label="Present today"
          value={loading ? "…" : stats.presentCount}
          icon={FiUserCheck}
          variant="success"
        />
        <StatCard
          label="Absent today"
          value={loading ? "…" : stats.absentCount}
          icon={FiUserX}
          variant="warning"
        />
        <StatCard
          label="Avg performance"
          value={loading ? "…" : `${stats.avgPerformance}%`}
          icon={FiTrendingUp}
        />
      </div>

      <EvaluationCompletion />

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Top performer</h3>
          <p className="stat-card__value" style={{ margin: "8px 0 0" }}>
            {loading ? "…" : stats.topPerformer}
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent activity</h3>
          {recentActivity.length > 0 ? (
            <ul className="activity-list">
              {recentActivity.map((activity, index) => (
                <li key={index}>
                  <span>{activity.text}</span>
                  <time>{activity.time}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "var(--muted)", margin: 0 }}>No recent activity</p>
          )}
        </div>
      </div>

      <section>
        <h2 className="section-title">Quick actions</h2>
        <div className="grid grid-auto">
          <ActionCard
            title="Employees"
            description="View and manage staff"
            icon={FiUsers}
            onClick={() => navigate("/employee-list")}
          />
          <ActionCard
            title="Evaluations"
            description="Review all submissions"
            icon={FiAward}
            onClick={() => navigate("/evaluations")}
          />
          <ActionCard
            title="Reports"
            description="Full evaluation reports"
            icon={FiTrendingUp}
            onClick={() => navigate("/reports")}
          />
          <ActionCard
            title="Attendance"
            description="Check-in records"
            icon={FiUserCheck}
            onClick={() => navigate("/attendance")}
          />
        </div>
      </section>
    </PageShell>
  );
}
