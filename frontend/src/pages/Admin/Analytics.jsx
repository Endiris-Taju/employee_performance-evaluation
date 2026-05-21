// src/pages/Admin/Analytics.jsx
import React, { useState, useEffect, useMemo } from "react";
import { FiTrendingUp, FiTrendingDown, FiUsers, FiCalendar, FiAward, FiActivity, FiClock, FiTarget, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import "./Analytics.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const EMPTY_ANALYTICS = {
  overview: {
    totalEmployees: 0,
    activeToday: 0,
    averagePerformance: 0,
    complianceRate: 0,
  },
  performance: {
    excellent: 0,
    good: 0,
    satisfactory: 0,
    needsImprovement: 0,
  },
  attendance: {
    presentRate: 0,
    absentRate: 0,
    lateRate: 0,
    averageWorkHours: 0,
  },
  departments: [],
};

function Analytics() {
  const { token } = useAuth();
  const [timeRange, setTimeRange] = useState("month");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [analyticsData, setAnalyticsData] = useState(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const headers = useMemo(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_URL}/analytics/overview?range=${timeRange}`, {
          headers,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to load analytics");
        if (!cancelled) {
          setAnalyticsData({
            overview: json.overview || EMPTY_ANALYTICS.overview,
            performance: json.performance || EMPTY_ANALYTICS.performance,
            attendance: {
              presentRate: json.attendance?.presentRate ?? 0,
              absentRate: Math.max(
                0,
                100 - (json.attendance?.presentRate ?? 0)
              ),
              lateRate: 0,
              averageWorkHours: 8,
            },
            departments: json.departments || [],
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, timeRange, headers]);

  const months = ["ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ"];

  const StatCard = ({ title, value, trend, icon, color = "primary" }) => (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-header">
        <div className="stat-icon">{icon}</div>
        <span className={`stat-trend ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`}>
          {trend > 0 ? <FiTrendingUp /> : trend < 0 ? <FiTrendingDown /> : <FiActivity />}
          {Math.abs(trend)}%
        </span>
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
      </div>
    </div>
  );

  const DepartmentCard = ({ department }) => (
    <div className="department-card">
      <div className="department-header">
        <h4>{department.name}</h4>
        <span className="employee-count">{department.employees} ሰራተኞች</span>
      </div>
      <div className="department-metrics">
        <div className="metric">
          <span className="metric-label">አፈጻጉም - Performance</span>
          <div className="metric-bar">
            <div 
              className="metric-fill performance" 
              style={{ width: `${department.performance}%` }}
            />
          </div>
          <span className="metric-value">{department.performance}%</span>
        </div>
        <div className="metric">
          <span className="metric-label">እለት መግቢያ - Attendance</span>
          <div className="metric-bar">
            <div 
              className="metric-fill attendance" 
              style={{ width: `${department.attendance}%` }}
            />
          </div>
          <span className="metric-value">{department.attendance}%</span>
        </div>
      </div>
    </div>
  );

  const filteredDepartments =
    selectedDepartment === "all"
      ? analyticsData.departments
      : analyticsData.departments.filter((d) => d.name === selectedDepartment);

  return (
    <div className="analytics-container">
      {error && (
        <div className="status-message error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      {loading && (
        <p style={{ color: "var(--muted)", marginBottom: 16 }}>Loading live analytics…</p>
      )}
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1 className="page-title">የኢትዮጵያ መንግስት እና የሰው ሃይል ልማት ቢሮ</h1>
          <p className="page-subtitle">Ethiopian Government Performance Analytics Dashboard</p>
        </div>
        <div className="header-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="week">የሳምንት - Week</option>
            <option value="month">የወር - Month</option>
            <option value="quarter">የሩብ - Quarter</option>
            <option value="year">ዓመት - Year</option>
          </select>
          <select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="department-selector"
          >
            <option value="all">ሁሉም የስራ ቦታ - All Departments</option>
            {analyticsData.departments.map((dept, index) => (
              <option key={index} value={dept.name}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="overview-section">
        <h2 className="section-title">አጠቃላይ እይታዎች - Overview</h2>
        <div className="stats-grid">
          <StatCard 
            title="ጠቅላላ ሰራተኞች - Total Employees" 
            value={analyticsData.overview.totalEmployees}
            trend={2.3}
            icon={<FiUsers />}
            color="primary"
          />
          <StatCard 
            title="ዛሬ የተገኙ - Active Today" 
            value={analyticsData.overview.activeToday}
            trend={1.8}
            icon={<FiActivity />}
            color="success"
          />
          <StatCard 
            title="አማካይ አፈጻጉም - Avg Performance" 
            value={`${analyticsData.overview.averagePerformance}%`}
            trend={3.2}
            icon={<FiAward />}
            color="warning"
          />
          <StatCard 
            title="ተገና መጠን - Compliance Rate" 
            value={`${analyticsData.overview.complianceRate}%`}
            trend={1.5}
            icon={<FiTarget />}
            color="info"
          />
        </div>
      </div>

      {/* Performance Distribution */}
      <div className="performance-section">
        <h2 className="section-title">የአፈጻጉም ስርጭት - Performance Distribution</h2>
        <div className="performance-grid">
          <div className="performance-item excellent">
            <div className="performance-header">
              <span className="performance-label">ከፍተኛ - Excellent</span>
              <span className="performance-count">{analyticsData.performance.excellent}</span>
            </div>
            <div className="performance-bar">
              <div 
                className="performance-fill" 
                style={{ width: `${(analyticsData.performance.excellent / analyticsData.overview.totalEmployees) * 100}%` }}
              />
            </div>
          </div>
          <div className="performance-item good">
            <div className="performance-header">
              <span className="performance-label">ጥሩ - Good</span>
              <span className="performance-count">{analyticsData.performance.good}</span>
            </div>
            <div className="performance-bar">
              <div 
                className="performance-fill" 
                style={{ width: `${(analyticsData.performance.good / analyticsData.overview.totalEmployees) * 100}%` }}
              />
            </div>
          </div>
          <div className="performance-item satisfactory">
            <div className="performance-header">
              <span className="performance-label">ደስታል - Satisfactory</span>
              <span className="performance-count">{analyticsData.performance.satisfactory}</span>
            </div>
            <div className="performance-bar">
              <div 
                className="performance-fill" 
                style={{ width: `${(analyticsData.performance.satisfactory / analyticsData.overview.totalEmployees) * 100}%` }}
              />
            </div>
          </div>
          <div className="performance-item needs-improvement">
            <div className="performance-header">
              <span className="performance-label">ማሻሻል ይኖር - Needs Improvement</span>
              <span className="performance-count">{analyticsData.performance.needsImprovement}</span>
            </div>
            <div className="performance-bar">
              <div 
                className="performance-fill" 
                style={{ width: `${(analyticsData.performance.needsImprovement / analyticsData.overview.totalEmployees) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Departments */}
      <div className="departments-section">
        <h2 className="section-title">የስራ ቦታዎች - Departments</h2>
        <div className="departments-grid">
          {filteredDepartments.map((department, index) => (
            <DepartmentCard key={index} department={department} />
          ))}
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="attendance-section">
        <h2 className="section-title">እለት መግቢያ ስታቲስቲክስ - Attendance Statistics</h2>
        <div className="attendance-stats">
          <div className="attendance-stat">
            <div className="attendance-icon present">
              <FiCheckCircle />
            </div>
            <div className="attendance-content">
              <div className="attendance-value">{analyticsData.attendance.presentRate}%</div>
              <div className="attendance-label">ተገኝቷል - Present</div>
            </div>
          </div>
          <div className="attendance-stat">
            <div className="attendance-icon absent">
              <FiXCircle />
            </div>
            <div className="attendance-content">
              <div className="attendance-value">{analyticsData.attendance.absentRate}%</div>
              <div className="attendance-label">አለመው - Absent</div>
            </div>
          </div>
          <div className="attendance-stat">
            <div className="attendance-icon late">
              <FiClock />
            </div>
            <div className="attendance-content">
              <div className="attendance-value">{analyticsData.attendance.lateRate}%</div>
              <div className="attendance-label">ደረበ - Late</div>
            </div>
          </div>
          <div className="attendance-stat">
            <div className="attendance-icon hours">
              <FiCalendar />
            </div>
            <div className="attendance-content">
              <div className="attendance-value">{analyticsData.attendance.averageWorkHours}h</div>
              <div className="attendance-label">አማካይ ሰዓት - Avg Hours</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="trends-section">
        <h2 className="section-title">አዝናኝ - Trends</h2>
        <div className="trends-chart">
          <div className="chart-header">
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color performance"></div>
                <span>አፈጻጉም - Performance</span>
              </div>
              <div className="legend-item">
                <div className="legend-color attendance"></div>
                <span>እለት መግቢያ - Attendance</span>
              </div>
              <div className="legend-item">
                <div className="legend-color growth"></div>
                <span>ሰራተኞች እድገር - Growth</span>
              </div>
            </div>
          </div>
          <div className="chart-content">
            <div className="chart-grid">
              {months.map((month, index) => (
                <div key={index} className="chart-column">
                  <div className="chart-bars">
                    <div 
                      className="chart-bar performance" 
                      style={{ height: `${(analyticsData.trends.monthlyPerformance[index] / 100) * 100}%` }}
                      title={`Performance: ${analyticsData.trends.monthlyPerformance[index]}%`}
                    />
                    <div 
                      className="chart-bar attendance" 
                      style={{ height: `${(analyticsData.trends.monthlyAttendance[index] / 100) * 100}%` }}
                      title={`Attendance: ${analyticsData.trends.monthlyAttendance[index]}%`}
                    />
                    <div 
                      className="chart-bar growth" 
                      style={{ height: `${(analyticsData.trends.employeeGrowth[index] / 200) * 100}%` }}
                      title={`Employees: ${analyticsData.trends.employeeGrowth[index]}`}
                    />
                  </div>
                  <div className="chart-label">{month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
