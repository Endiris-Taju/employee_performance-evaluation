import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Reports.css";
import { useData } from "../../context/DataContext";

function Reports() {
  const { collectedEvaluations, employees, teams, complaints } = useData();
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const getEmployeeName = (id) => {
    const employee = employees.find(e => e.id === id);
    return employee ? employee.name : 'Unknown Employee';
  };

  const getTeamName = (id) => {
    const team = teams.find(t => t.id === id);
    return team ? team.name : 'Unknown Team';
  };

  const filteredEvaluations = collectedEvaluations.filter(evaluation => {
    const matchesType = filterType === "all" || evaluation.type === filterType;
    const matchesSearch = searchTerm === "" || 
      getEmployeeName(evaluation.employee_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getEvaluationStats = () => {
    const workRateEvals = collectedEvaluations.filter(e => e.type === "workrate");
    const behavioralEvals = collectedEvaluations.filter(e => e.type === "behavioral");
    const peerEvals = collectedEvaluations.filter(e => e.type === "peer");
    const selfEvals = collectedEvaluations.filter(e => e.type === "self");

    return {
      workRate: workRateEvals.length,
      behavioral: behavioralEvals.length,
      peer: peerEvals.length,
      self: selfEvals.length,
      total: collectedEvaluations.length
    };
  };

  const stats = getEvaluationStats();

  const exportToCSV = () => {
    const headers = ["Employee", "Type", "Score", "Max Score", "Date", "Details"];
    const csvData = filteredEvaluations.map(evaluation => [
      getEmployeeName(evaluation.employee_id),
      evaluation.type,
      evaluation.total_score,
      evaluation.maxScore,
      new Date(evaluation.date).toLocaleDateString(),
      JSON.stringify(evaluation)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluations_${filterType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="reports-page">
        <div className="reports-header">
          <h1>Evaluation Reports</h1>
          <p>Comprehensive view of all collected evaluations across the organization</p>
        </div>

        {/* Statistics Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <h3>Total Evaluations</h3>
            <span className="stat-number">{stats.total}</span>
          </div>
          <div className="stat-card">
            <h3>Work Rate</h3>
            <span className="stat-number">{stats.workRate}</span>
          </div>
          <div className="stat-card">
            <h3>Behavioral</h3>
            <span className="stat-number">{stats.behavioral}</span>
          </div>
          <div className="stat-card">
            <h3>Peer</h3>
            <span className="stat-number">{stats.peer}</span>
          </div>
          <div className="stat-card">
            <h3>Self</h3>
            <span className="stat-number">{stats.self}</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="filter-controls">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="workrate">Work Rate</option>
              <option value="behavioral">Behavioral</option>
              <option value="peer">Peer</option>
              <option value="self">Self</option>
            </select>
            
            <input
              type="text"
              placeholder="Search by employee name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <button className="btn primary" onClick={exportToCSV}>
              Export to CSV
            </button>
          </div>
        </div>

        {/* Evaluations List */}
        <div className="evaluations-section">
          <h2>Evaluation Details</h2>
          
          {filteredEvaluations.length === 0 ? (
            <div className="no-results">
              <p>No evaluations found matching the current filters.</p>
            </div>
          ) : (
            <div className="evaluations-grid">
              {filteredEvaluations.map(evaluation => (
                <div key={evaluation.id} className="evaluation-card">
                  <div className="eval-header">
                    <span className={`eval-type ${evaluation.type}`}>
                      {evaluation.type.charAt(0).toUpperCase() + evaluation.type.slice(1)}
                    </span>
                    <span className="eval-score">
                      {Number(evaluation.total_score || 0).toFixed(2)} / {evaluation.max_score || 0}
                    </span>
                  </div>
                  
                  <div className="eval-body">
                    <div className="eval-info">
                      <p><strong>Employee:</strong> {getEmployeeName(evaluation.employee_id)}</p>
                      <p><strong>Date:</strong> {new Date(evaluation.date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {new Date(evaluation.date).toLocaleTimeString()}</p>
                    </div>
                    
                    {evaluation.type === "workrate" && evaluation.tasks && (
                      <div className="eval-details">
                        <p><strong>Tasks Evaluated:</strong> {evaluation.tasks.length}</p>
                        <div className="tasks-list">
                          {evaluation.tasks.map((task, index) => (
                            <div key={index} className="task-item">
                              <span>{task.task}</span>
                              <span>{task.percent}% - Rank {task.rank}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {evaluation.type === "behavioral" && evaluation.criteria && (
                      <div className="eval-details">
                        <p><strong>Criteria Evaluated:</strong> {evaluation.criteria.length}</p>
                      </div>
                    )}
                    
                    {evaluation.type === "peer" && (
                      <div className="eval-details">
                        <p><strong>From:</strong> {getEmployeeName(evaluation.fromEmployeeId)}</p>
                        <p><strong>To:</strong> {getEmployeeName(evaluation.toEmployeeId)}</p>
                        <p><strong>Team:</strong> {getTeamName(evaluation.teamId)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaints Section */}
        <div className="complaints-section">
          <h2>Employee Complaints</h2>
          {complaints.length === 0 ? (
            <p>No complaints filed at this time.</p>
          ) : (
            <div className="complaints-list">
              {complaints.map(complaint => {
                const employee = employees.find(e => e.id === complaint.employeeId);
                return (
                  <div key={complaint.id} className="complaint-item">
                    <div className="complaint-header">
                      <h4>{employee?.name || 'Unknown Employee'}</h4>
                      <span className={`status ${complaint.status}`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p><strong>Reason:</strong> {complaint.reason}</p>
                    <p><strong>Description:</strong> {complaint.description}</p>
                    <p><strong>Date:</strong> {new Date(complaint.date).toLocaleDateString()}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="back-link">
          <Link to="/admin" className="btn secondary">← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

export default Reports;


