import React, { useState, useEffect } from "react";
import "./EmployeeDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import databaseService from "../../services/DatabaseService";

function Card({ title, actionText, onClick }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <button className="btn primary" onClick={onClick}>
        {actionText}
      </button>
    </div>
  );
}

function EmployeeDashboard() {
  const { email, name } = useAuth();
  const { employees = [] } = useData();
  const navigate = useNavigate();
  const [myStats, setMyStats] = useState({
    evaluationScore: 0,
    attendanceCount: 0,
    reportsCount: 0,
    lastActivity: "No recent activity"
  });
  const [loading, setLoading] = useState(true);

  // Try to find employee by email, or use auth context data
  const me = employees.find((e) => e.email === email) || {
    id: 1, // fallback ID
    name: name || email?.split('@')[0] || 'Employee',
    email: email || '',
    department: 'Unknown',
    rank: 'Employee',
    employee_id: 'N/A',
    phone: 'N/A',
    position: 'N/A'
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [me.id]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Fetch employee's evaluations
      const evaluations = await databaseService.getEvaluations(me.id);
      const latestEvaluation = evaluations?.[evaluations.length - 1];
      const evaluationScore = latestEvaluation?.selfPercentage || latestEvaluation?.percentage || 0;
      
      // Fetch attendance records
      const today = new Date().toISOString().split('T')[0];
      const attendanceRecords = await databaseService.getAttendance(me.id, {
        start: today,
        end: today
      });
      const attendanceCount = attendanceRecords?.length || 0;
      
      // Fetch reports
      const reports = await databaseService.getReports(me.id);
      const reportsCount = reports?.length || 0;
      
      // Determine last activity
      const lastEvalTime = latestEvaluation?.createdAt;
      const lastAttendanceTime = attendanceRecords?.[attendanceRecords.length - 1]?.createdAt;
      const lastReportTime = reports?.[reports.length - 1]?.createdAt;
      
      const timestamps = [lastEvalTime, lastAttendanceTime, lastReportTime].filter(Boolean);
      const lastActivity = timestamps.length > 0 
        ? new Date(Math.max(...timestamps.map(t => new Date(t).getTime()))).toLocaleString()
        : "No recent activity";

      setMyStats({
        evaluationScore,
        attendanceCount,
        reportsCount,
        lastActivity
      });
    } catch (error) {
      console.error('Employee dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Employee Dashboard</h2>
        <p style={{ marginTop: 6, marginBottom: 0, color: "var(--muted)" }}>
          Welcome, {me.name}.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-auto" style={{ marginBottom: 16 }}>
        <div className="card">
          <h4>Latest Evaluation Score</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
            {loading ? "..." : `${myStats.evaluationScore}%`}
          </p>
        </div>
        <div className="card">
          <h4>Today's Attendance</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
            {loading ? "..." : myStats.attendanceCount > 0 ? "✓ Present" : "Not marked"}
          </p>
        </div>
        <div className="card">
          <h4>Reports Generated</h4>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--info)' }}>
            {loading ? "..." : myStats.reportsCount}
          </p>
        </div>
        <div className="card">
          <h4>Last Activity</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
            {loading ? "..." : myStats.lastActivity}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid grid-auto">
          <div><strong>Employee ID:</strong> {me.employee_id || "N/A"}</div>
          <div><strong>Email:</strong> {me.email}</div>
          <div><strong>Department:</strong> {me.department || "N/A"}</div>
          <div><strong>Position:</strong> {me.position || "N/A"}</div>
          <div><strong>Phone:</strong> {me.phone || "N/A"}</div>
          <div><strong>Rank:</strong> {me.rank || "N/A"}</div>
        </div>
      </div>

      <div className="grid grid-auto">
        <Card title="Self Evaluation" actionText="Start" onClick={() => navigate("/self-evaluation")} />
        <Card title="Peer Evaluation" actionText="Evaluate" onClick={() => navigate("/peerEvaluation")} />
        <Card title="My Reports" actionText="Open" onClick={() => navigate("/my-reports")} />
      </div>
    </div>
  );
}

export default EmployeeDashboard;