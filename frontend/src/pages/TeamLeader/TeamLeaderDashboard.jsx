// src/pages/TeamLeader/TeamLeaderDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./TeamLeaderDashboard.css";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import Card from "../../components/Card";

function TabNav({ toggleTab, active }) {
  return (
    <div className="tab-nav">
      <span
        className={active === "overview" ? "active" : ""}
        onClick={() => toggleTab("overview")}
      >
        Overview
      </span>
      <span
        className={active === "calendar" ? "active" : ""}
        onClick={() => toggleTab("calendar")}
      >
        Calendar
      </span>
      <span
        className={active === "evaluations" ? "active" : ""}
        onClick={() => toggleTab("evaluations")}
      >
        Collect All Evaluations
      </span>
    </div>
  );
}

function CalendarBox() {
  return (
    <div className="calendar-box">
      <h3>Evaluation Schedule</h3>
      <div className="eval-dates">
        <p>
          <strong>First Round:</strong> March 15, 2025
        </p>
        <p>
          <strong>Second Round:</strong> June 15, 2025
        </p>
      </div>
    </div>
  );
}

function EvaluationsOverview({ collectedEvaluations = [], employees = [], teams = [] }) {
  const workRateEvals = (collectedEvaluations || []).filter(e => e.type === "workrate");
  const behavioralEvals = (collectedEvaluations || []).filter(e => e.type === "behavioral");
  const peerEvals = (collectedEvaluations || []).filter(e => e.type === "peer");
  const selfEvals = (collectedEvaluations || []).filter(e => e.type === "self");

  const getEmployeeName = (id) => {
    const employee = (employees || []).find(e => e.id === id);
    return employee ? employee.name : "Unknown Employee";
  };

  const getTeamName = (id) => {
    const team = (teams || []).find(t => t.id === id);
    return team ? team.name : "Unknown Team";
  };

  return (
    <div className="evaluations-overview">
      <h2>All Collected Evaluations</h2>

      {/* Work Rate Evaluations */}
      <div className="eval-section">
        <h3>Work Rate Evaluations (Out of 70)</h3>
        {workRateEvals.length === 0 ? (
          <p className="no-evals">No work rate evaluations submitted yet.</p>
        ) : (
          <div className="eval-list">
            {workRateEvals.map(evaluation => (
              <div key={evaluation.id} className="eval-item">
                <div className="eval-header">
                  <span className="eval-type">Work Rate</span>
                  <span className="eval-score">{Number(evaluation.total_score || 0).toFixed(2)} / 70</span>
                </div>
                <div className="eval-details">
                  <p><strong>Employee:</strong> {getEmployeeName(evaluation.employee_id)}</p>
                  <p><strong>Date:</strong> {new Date(evaluation.date).toLocaleDateString()}</p>
                  <p><strong>Tasks:</strong> {evaluation.tasks?.length || 0} tasks evaluated</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Behavioral Evaluations */}
      <div className="eval-section">
        <h3>Behavioral Evaluations (Out of 10)</h3>
        {behavioralEvals.length === 0 ? (
          <p className="no-evals">No behavioral evaluations submitted yet.</p>
        ) : (
          <div className="eval-list">
            {behavioralEvals.map(evaluation => (
              <div key={evaluation.id} className="eval-item">
                <div className="eval-header">
                  <span className="eval-type">Behavioral</span>
                  <span className="eval-score">{Number(evaluation.total_score || 0).toFixed(2)} / 10</span>
                </div>
                <div className="eval-details">
                  <p><strong>Employee:</strong> {getEmployeeName(evaluation.employee_id)}</p>
                  <p><strong>Date:</strong> {new Date(evaluation.date).toLocaleDateString()}</p>
                  <p><strong>Criteria:</strong> {evaluation.criteria?.length || 0} criteria evaluated</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Peer Evaluations */}
      <div className="eval-section">
        <h3>Peer Evaluations (Out of 15)</h3>
        {peerEvals.length === 0 ? (
          <p className="no-evals">No peer evaluations submitted yet.</p>
        ) : (
          <div className="eval-list">
            {peerEvals.map(evaluation => (
              <div key={evaluation.id} className="eval-item">
                <div className="eval-header">
                  <span className="eval-type">Peer</span>
                  <span className="eval-score">{Number(evaluation.total_score || 0).toFixed(2)} / 15</span>
                </div>
                <div className="eval-details">
                  <p><strong>From:</strong> {getEmployeeName(evaluation.from_employee_id)}</p>
                  <p><strong>To:</strong> {getEmployeeName(evaluation.to_employee_id)}</p>
                  <p><strong>Team:</strong> {getTeamName(evaluation.team_id)}</p>
                  <p><strong>Date:</strong> {new Date(evaluation.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Self Evaluations */}
      <div className="eval-section">
        <h3>Self Evaluations (Out of 5)</h3>
        {selfEvals.length === 0 ? (
          <p className="no-evals">No self evaluations submitted yet.</p>
        ) : (
          <div className="eval-list">
            {selfEvals.map(evaluation => (
              <div key={evaluation.id} className="eval-item">
                <div className="eval-header">
                  <span className="eval-type">Self</span>
                  <span className="eval-score">{Number(evaluation.total_score || 0).toFixed(2)} / 5</span>
                </div>
                <div className="eval-details">
                  <p><strong>Employee:</strong> {getEmployeeName(evaluation.employee_id)}</p>
                  <p><strong>Date:</strong> {new Date(evaluation.date).toLocaleDateString()}</p>
                  <p><strong>Categories:</strong> {Object.keys(evaluation.scores || {}).length} categories</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="eval-summary">
        <h3>Evaluation Summary</h3>
        <div className="summary-stats">
          <div className="summary-stat"><span>Total Evaluations:</span> {collectedEvaluations.length}</div>
          <div className="summary-stat"><span>Work Rate:</span> {workRateEvals.length}</div>
          <div className="summary-stat"><span>Behavioral:</span> {behavioralEvals.length}</div>
          <div className="summary-stat"><span>Peer:</span> {peerEvals.length}</div>
          <div className="summary-stat"><span>Self:</span> {selfEvals.length}</div>
        </div>
      </div>
    </div>
  );
}

const TeamLeaderDashboard = () => {
  const { name, email, logout } = useAuth();
  const {
    employees = [],
    teams = [],
    tasks = [],
    evaluations = [],
    collectedEvaluations = [],
    fetchEmployees,
    fetchTeams,
    fetchTasks,
    fetchEvaluations,
  } = useData();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch fresh data on mount
  useEffect(() => {
    fetchEmployees?.();
    fetchTeams?.();
    fetchTasks?.();
    fetchEvaluations?.();
  }, [fetchEmployees, fetchTeams, fetchTasks, fetchEvaluations]);

  const totalEmployees = employees?.length || 0;
  const totalTeams = teams?.length || 0;
  const totalTasks = tasks?.length || 0;
  const totalEvaluations = evaluations?.length || 0;

  const pendingTasks = (tasks || []).filter((t) => t.status !== "completed");
  const completedTasks = (tasks || []).filter((t) => t.status === "completed");

  const toggleTab = (tab) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Leader Dashboard</h2>
        <p style={{ marginTop: 6, marginBottom: 0, color: "var(--muted)" }}>
          Track tasks, submit evaluations, and review team performance.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <TabNav toggleTab={toggleTab} active={activeTab} />
      </div>

      {activeTab === "overview" && (
        <div className="fancy-panel">
          <h2 className="fancy-title">Overview</h2>
          <div className="fancy-content">
            <Card title="Employees" description={`Total: ${totalEmployees}`} />
            <Card title="Teams" description={`Total: ${totalTeams}`} />
            <Card title="Tasks" description={`Total: ${totalTasks}`} />
            <Card title="Evaluations" description={`Total: ${totalEvaluations}`} />
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="fancy-panel">
          <h2 className="fancy-title">Evaluation Calendar</h2>
          <CalendarBox />
        </div>
      )}

      {activeTab === "evaluations" && (
        <div className="fancy-panel">
          <EvaluationsOverview
            collectedEvaluations={collectedEvaluations}
            employees={employees}
            teams={teams}
          />
        </div>
      )}

      {/* Extra Quick Actions */}
      <div className="dashboard-container">
        <div className="dashboard-panels">
          <div className="card">
            <h3>Work Rate Evaluation (out of 70)</h3>
            <button className="btn" onClick={() => navigate("/leader/tasks")}>
              Create Task
            </button>
          </div>
          <div className="card">
            <h3>Behavioral Evaluation (out of 10)</h3>
            <button className="btn" onClick={() => navigate("/leader/behavioral")}>
              Evaluation
            </button>
          </div>
          <div className="card">
            <h3>Collected Evaluations</h3>
            <button className="btn primary" onClick={() => setActiveTab("evaluations")}>
              See All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeaderDashboard;
