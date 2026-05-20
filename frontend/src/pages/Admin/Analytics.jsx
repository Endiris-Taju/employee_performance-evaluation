// src/pages/Admin/Analytics.jsx
import React, { useState, useEffect } from "react";
import { FiTrendingUp, FiTrendingDown, FiUsers, FiCalendar, FiAward, FiActivity, FiClock, FiTarget, FiCheckCircle, FiXCircle } from "react-icons/fi";
import "./Analytics.css";

function Analytics() {
  const [timeRange, setTimeRange] = useState("month");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalEmployees: 156,
      activeToday: 142,
      averagePerformance: 85.3,
      complianceRate: 92.7
    },
    performance: {
      excellent: 45,
      good: 78,
      satisfactory: 28,
      needsImprovement: 5
    },
    attendance: {
      presentRate: 94.2,
      absentRate: 3.8,
      lateRate: 2.0,
      averageWorkHours: 7.8
    },
    departments: [
      { name: "ህግደፍት - Human Resources", employees: 25, performance: 88.5, attendance: 95.2 },
      { name: "ፋይናንስ - Finance", employees: 18, performance: 91.2, attendance: 96.1 },
      { name: "ቴክኖሎጂ - Technology", employees: 32, performance: 86.8, attendance: 93.5 },
      { name: "አስተማማኝት - Operations", employees: 41, performance: 84.1, attendance: 94.8 },
      { name: "ህግ - Legal", employees: 12, performance: 89.3, attendance: 97.2 },
      { name: "አስተምህርት - Education", employees: 28, performance: 87.6, attendance: 92.9 }
    ],
    trends: {
      monthlyPerformance: [82, 84, 83, 85, 87, 86, 88, 85, 87, 89, 88, 85.3],
      monthlyAttendance: [92, 93, 91, 94, 93, 95, 94, 93, 94, 95, 94, 94.2],
      employeeGrowth: [140, 142, 145, 148, 150, 152, 153, 154, 155, 156, 156, 156]
    }
  });

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

  return (
    <div className="analytics-container">
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
          {analyticsData.departments.map((department, index) => (
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
