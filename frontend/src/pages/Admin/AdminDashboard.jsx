import { Users, BarChart3, ClipboardCheck, Star } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useData } from "../../context/DataContext";
import databaseService from "../../services/DatabaseService";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { employees } = useData();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    attendanceToday: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    avgPerformance: 0,
    topPerformer: "N/A"
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [employees]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      // Calculate total employees
      const totalEmployees = employees?.length || 0;
      console.log('Total employees:', totalEmployees);
      
      // Fetch today's attendance from photos and attendance records
      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching attendance for:', today);
      
      // Try to get attendance photos first
      const attendancePhotos = await databaseService.getPhotos('attendance_photo');
      const todayPhotos = attendancePhotos?.filter(photo => 
        photo.createdAt && photo.createdAt.startsWith(today)
      ) || [];
      
      // Also try to get attendance records
      let attendanceRecords = [];
      try {
        attendanceRecords = await databaseService.getAttendance(null, {
          start: today,
          end: today
        });
      } catch (err) {
        console.log('Attendance API not available, using photos only');
      }
      
      // Combine both sources
      const allAttendanceRecords = [...todayPhotos, ...(attendanceRecords || [])];
      console.log('All attendance records:', allAttendanceRecords);
      
      // Categorize attendance by status
      const presentCount = allAttendanceRecords?.filter(record => 
        record.attendanceStatus === 'present' || record.type === 'attendance_photo'
      ).length || 0;
      
      const lateCount = allAttendanceRecords?.filter(record => 
        record.attendanceStatus === 'late'
      ).length || 0;
      
      const absentCount = employees?.length - presentCount - lateCount || 0;
      
      const attendanceToday = allAttendanceRecords?.length || 0;
      
      // Fetch evaluations for performance data
      const evaluations = await databaseService.getEvaluations();
      console.log('Evaluations:', evaluations);
      
      const avgPerformance = evaluations?.length > 0 
        ? Math.round(evaluations.reduce((sum, evaluation) => {
            const score = evaluation.selfPercentage || evaluation.percentage || 0;
            return sum + Number(score);
          }, 0) / evaluations.length)
        : 0;
      
      // Find top performer
      const topPerformerEval = evaluations?.reduce((top, evaluation) => {
        const score = evaluation.selfPercentage || evaluation.percentage || 0;
        const topScore = top?.selfPercentage || top?.percentage || 0;
        return score > topScore ? evaluation : top;
      }, null);
      const topPerformer = topPerformerEval?.employeeName || "N/A";
      
      // Generate recent activity
      const activities = [
        ...(evaluations?.slice(-3).map(evaluation => ({
          text: `✓ ${evaluation.employeeName || 'Employee'} submitted evaluation`,
          time: new Date(evaluation.createdAt).toLocaleString()
        })) || []),
        ...(allAttendanceRecords?.slice(-2).map(record => ({
          text: `✓ ${record.employeeName || 'Employee'} marked attendance (${record.attendanceStatus || 'present'})`,
          time: new Date(record.createdAt).toLocaleString()
        })) || [])
      ].slice(-4);

      console.log('Final stats:', {
        totalEmployees,
        attendanceToday,
        presentCount,
        lateCount,
        absentCount,
        avgPerformance,
        topPerformer
      });

      setStats({
        totalEmployees,
        attendanceToday,
        presentCount,
        lateCount,
        absentCount,
        avgPerformance,
        topPerformer
      });
      setRecentActivity(activities);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      // Set default values on error
      setStats({
        totalEmployees: employees?.length || 0,
        attendanceToday: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: employees?.length || 0,
        avgPerformance: 0,
        topPerformer: "No data"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">
        <h1 className="text-2xl font-bold mb-10">Admin Panel</h1>

        <nav className="space-y-3">
          <NavItem icon={<BarChart3 size={18} />} text="Dashboard" active />
          <NavItem icon={<Users size={18} />} text="Employees" onClick={() => navigate("/employee-list")} />
          <NavItem icon={<ClipboardCheck size={18} />} text="Attendance" onClick={() => navigate("/attendance")} />
          <NavItem icon={<Star size={18} />} text="Evaluations" onClick={() => navigate("/reports")} />
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 space-y-8">
        {/* Top bar */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Dashboard Overview</h2>
          <div className="flex gap-3">
            <button 
              className="btn-modern" 
              onClick={fetchDashboardData}
              disabled={loading}
            >
              {loading ? "Loading..." : "🔄 Refresh"}
            </button>
            <button className="btn-modern" onClick={() => navigate("/addEmployee")}>
              + Add Employee
            </button>
          </div>
        </div>

        {/* Stats */}
        <section className="grid md:grid-cols-4 gap-6">
          <StatCard title="Total Employees" value={loading ? "..." : stats.totalEmployees} icon={<Users />} />
          <StatCard title="Present Today" value={loading ? "..." : stats.presentCount} icon={<ClipboardCheck />} />
          <StatCard title="Late Today" value={loading ? "..." : stats.lateCount} icon={<BarChart3 />} />
          <StatCard title="Absent Today" value={loading ? "..." : stats.absentCount} icon={<Star />} />
        </section>

        {/* Performance Stats */}
        <section className="grid md:grid-cols-2 gap-6">
          <StatCard title="Avg Performance" value={loading ? "..." : `${stats.avgPerformance}%`} icon={<BarChart3 />} />
          <StatCard title="Top Performer" value={loading ? "..." : stats.topPerformer} icon={<Star />} />
        </section>

        {/* Chart + Activity */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4">Performance Overview</h3>
            <div className="h-64 flex items-center justify-center text-slate-400">
              {loading ? "Loading data..." : `Average Performance: ${stats.avgPerformance}%`}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
            <ul className="space-y-3 text-slate-300">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <li key={index}>
                    {activity.text}
                    <div className="text-xs text-slate-500">{activity.time}</div>
                  </li>
                ))
              ) : (
                <li>No recent activity</li>
              )}
            </ul>
          </div>
        </section>

        {/* Table */}
        <section className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-6">Recent Employees</h3>

          <table className="w-full text-left">
            <thead className="text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3">Name</th>
                <th>Department</th>
                <th>Status</th>
                <th>Score</th>
              </tr>
            </thead>

            <tbody className="space-y-2">
              {employees?.slice(0, 4).map((employee) => (
                <Row 
                  key={employee.id} 
                  name={employee.name || 'N/A'} 
                  dept={employee.department || 'N/A'} 
                  status="Active" 
                  score="N/A" 
                />
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

function NavItem({ icon, text, active, onClick }) {
  return (
    <div 
      className={`nav-item-modern ${active ? "active" : ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {icon}
      {text}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="stats-card flex items-center gap-4">
      <div className="p-3 bg-blue-600/20 rounded-xl">{icon}</div>
      <div>
        <p className="text-slate-400 text-sm">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
    </div>
  );
}

function Row({ name, dept, status, score }) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/40">
      <td className="py-3">{name}</td>
      <td>{dept}</td>
      <td>
        <span className="badge-success">{status}</span>
      </td>
      <td>{score}</td>
    </tr>
  );
}