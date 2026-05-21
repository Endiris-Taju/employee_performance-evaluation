import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAward,
  FiCamera,
  FiZap,
  FiFileText,
  FiUsers,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import EvaluationCompletion from "../../components/EvaluationCompletion";
import PageShell from "../../components/layout/PageShell";
import StatCard from "../../components/ui/StatCard";
import ActionCard from "../../components/ui/ActionCard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function EmployeeDashboard() {
  const { email, name, userId, token } = useAuth();
  const { employees = [], evaluations = [] } = useData();
  const navigate = useNavigate();

  const headers = useMemo(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const me =
    employees.find((e) => e.email === email) ||
    employees.find((e) => String(e.id) === String(userId));

  const [myStats, setMyStats] = useState({
    evaluationScore: 0,
    attendanceToday: false,
    efficiency: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!me?.id) return;
    fetchEmployeeData();
  }, [me?.id, evaluations, token]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);

      const selfEval = [...(evaluations || [])]
        .filter((e) => e.type === "self")
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      const evaluationScore = Number(selfEval?.percentage || 0);

      const today = new Date().toISOString().split("T")[0];
      const attRes = await fetch(`${API_URL}/attendance/me?date=${today}`, { headers });
      const attLogs = attRes.ok ? await attRes.json() : [];
      const attendanceToday = (Array.isArray(attLogs) ? attLogs : []).some(
        (r) => r.event_type === "checkin"
      );

      let efficiency = null;
      const effRes = await fetch(`${API_URL}/efficiency/employee/${me.id}`, { headers });
      if (effRes.ok) {
        efficiency = await effRes.json();
      }

      setMyStats({ evaluationScore, attendanceToday, efficiency });
    } catch (error) {
      console.error("Employee dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title={`Welcome, ${me?.name || name || "there"}`}
      subtitle="Your evaluations, attendance, and performance at a glance."
    >
      <div className="grid grid-3">
        <StatCard
          label="Latest self-evaluation"
          value={loading ? "…" : `${myStats.evaluationScore}%`}
          icon={FiAward}
        />
        <StatCard
          label="Today's attendance"
          value={loading ? "…" : myStats.attendanceToday ? "Present" : "Not marked"}
          icon={FiCamera}
          variant={myStats.attendanceToday ? "success" : "warning"}
        />
        <StatCard
          label="Overall efficiency"
          value={
            loading
              ? "…"
              : myStats.efficiency
                ? `${myStats.efficiency.efficiency_percent}%`
                : "—"
          }
          icon={FiZap}
        />
      </div>

      <EvaluationCompletion />

      <section>
        <h2 className="section-title">What would you like to do?</h2>
        <div className="grid grid-auto">
          <ActionCard
            title="Self evaluation"
            description="Rate your own performance"
            icon={FiAward}
            onClick={() => navigate("/self-evaluation")}
          />
          <ActionCard
            title="Peer evaluation"
            description="Evaluate a colleague"
            icon={FiUsers}
            onClick={() => navigate("/peerEvaluation")}
          />
          <ActionCard
            title="Attendance"
            description="Mark check-in or check-out"
            icon={FiCamera}
            onClick={() => navigate("/attendance")}
          />
          <ActionCard
            title="My efficiency"
            description="View your efficiency score"
            icon={FiZap}
            onClick={() => navigate("/efficiency")}
          />
          <ActionCard
            title="My reports"
            description="Download or view reports"
            icon={FiFileText}
            onClick={() => navigate("/my-reports")}
          />
        </div>
      </section>
    </PageShell>
  );
}

export default EmployeeDashboard;
