import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiLayers,
  FiCheckSquare,
  FiAward,
  FiList,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import EvaluationCompletion from "../../components/EvaluationCompletion";
import PageShell from "../../components/layout/PageShell";
import StatCard from "../../components/ui/StatCard";
import ActionCard from "../../components/ui/ActionCard";

function EvaluationsOverview({ collectedEvaluations = [], employees = [], teams = [] }) {
  const workRateEvals = (collectedEvaluations || []).filter((e) => e.type === "workrate");
  const behavioralEvals = (collectedEvaluations || []).filter((e) => e.type === "behavioral");
  const peerEvals = (collectedEvaluations || []).filter((e) => e.type === "peer");
  const selfEvals = (collectedEvaluations || []).filter((e) => e.type === "self");

  const getEmployeeName = (id) => {
    const employee = (employees || []).find((e) => e.id === id);
    return employee ? employee.name : "Unknown";
  };

  const getTeamName = (id) => {
    const team = (teams || []).find((t) => t.id === id);
    return team ? team.name : "Unknown team";
  };

  const sections = [
    { title: "Work rate (out of 70)", evals: workRateEvals, max: 70 },
    { title: "Behavioral (out of 10)", evals: behavioralEvals, max: 10 },
    { title: "Peer (out of 15)", evals: peerEvals, max: 15 },
    { title: "Self (out of 5)", evals: selfEvals, max: 5 },
  ];

  return (
    <div className="stack">
      {sections.map(({ title, evals, max }) => (
        <div key={title} className="card card--flat">
          <h3 style={{ marginTop: 0 }}>{title}</h3>
          {evals.length === 0 ? (
            <p style={{ color: "var(--muted)", margin: 0 }}>No submissions yet.</p>
          ) : (
            <ul className="activity-list">
              {evals.map((evaluation) => (
                <li key={evaluation.id}>
                  <span>
                    {evaluation.type === "peer"
                      ? `${getEmployeeName(evaluation.from_employee_id)} → ${getEmployeeName(evaluation.to_employee_id)}`
                      : getEmployeeName(evaluation.employee_id)}
                    {evaluation.team_id && ` · ${getTeamName(evaluation.team_id)}`}
                  </span>
                  <time>
                    {Number(evaluation.total_score || 0).toFixed(1)} / {max} ·{" "}
                    {new Date(evaluation.date).toLocaleDateString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <div className="grid grid-4">
        <StatCard label="Total" value={collectedEvaluations.length} />
        <StatCard label="Work rate" value={workRateEvals.length} />
        <StatCard label="Behavioral" value={behavioralEvals.length} />
        <StatCard label="Peer + self" value={peerEvals.length + selfEvals.length} />
      </div>
    </div>
  );
}

const TeamLeaderDashboard = () => {
  const { name } = useAuth();
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

  return (
    <PageShell
      title="Team leader dashboard"
      subtitle={name ? `Hello, ${name}. Manage your team and evaluations.` : "Manage your team and evaluations."}
    >
      <div className="tabs" role="tablist">
        {[
          { id: "overview", label: "Overview" },
          { id: "calendar", label: "Schedule" },
          { id: "evaluations", label: "All evaluations" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={activeTab === tab.id ? "is-active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <EvaluationCompletion />
          <div className="grid grid-4">
            <StatCard label="Employees" value={totalEmployees} icon={FiUsers} />
            <StatCard label="Teams" value={totalTeams} icon={FiLayers} />
            <StatCard label="Tasks" value={totalTasks} icon={FiCheckSquare} />
            <StatCard label="Evaluations" value={totalEvaluations} icon={FiAward} />
          </div>
          <section>
            <h2 className="section-title">Quick actions</h2>
            <div className="grid grid-auto">
              <ActionCard
                title="Tasks"
                description="Create and assign work"
                icon={FiCheckSquare}
                onClick={() => navigate("/leader/tasks")}
              />
              <ActionCard
                title="Behavioral review"
                description="Rate team behavior"
                icon={FiAward}
                onClick={() => navigate("/leader/behavioral")}
              />
              <ActionCard
                title="All evaluations"
                description="View collected submissions"
                icon={FiList}
                onClick={() => setActiveTab("evaluations")}
              />
              <ActionCard
                title="Self evaluation"
                description="Submit your own review"
                icon={FiAward}
                onClick={() => navigate("/self-evaluation")}
              />
            </div>
          </section>
        </>
      )}

      {activeTab === "calendar" && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Evaluation schedule</h3>
          <p style={{ margin: "8px 0" }}>
            <strong>First round:</strong> March 15, 2025
          </p>
          <p style={{ margin: "8px 0 0" }}>
            <strong>Second round:</strong> June 15, 2025
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: 16 }}>
            Configure cycles in admin settings when available for your org.
          </p>
        </div>
      )}

      {activeTab === "evaluations" && (
        <EvaluationsOverview
          collectedEvaluations={collectedEvaluations}
          employees={employees}
          teams={teams}
        />
      )}
    </PageShell>
  );
};

export default TeamLeaderDashboard;
