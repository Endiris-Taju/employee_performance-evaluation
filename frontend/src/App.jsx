// src/App.jsx
import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { useAuth } from "./context/AuthContext";

// Admin pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import EmployeeList from "./pages/Admin/EmployeeList";
import AddEmployee from "./pages/Admin/AddEmployee";
import Teams from "./pages/Admin/Teams";
import Reports from "./pages/Admin/Reports";
import EmployeeDetails from "./pages/Admin/EmployeeDetails";

// Team Leader pages
import TeamLeaderDashboard from "./pages/TeamLeader/TeamLeaderDashboard";
import Tasks from "./pages/TeamLeader/Tasks";
import ManagerBehavioral from "./pages/TeamLeader/ManagerBehavioral";
import LeaderReports from "./pages/TeamLeader/Reports";
import AllEvaluations from "./pages/Leader/AllEvaluations";

// Employee / Member pages
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import SelfEvaluation from "./pages/Employee/SelfEvaluation";
import PeerEvaluationForm from "./pages/Employee/PeerEvaluationForm";
import PeerEvaluation from "./pages/Employee/PeerEvaluation";
import EmployeeReports from "./pages/Employee/Reports";

// Common pages
import LoginForm from "./components/LoginForm/LoginForm";
import Profile from "./pages/Common/Profile";
import Settings from "./pages/Common/Settings";
import AttendanceCamera from "./pages/Common/AttendanceCamera";
import Efficiency from "./pages/Common/Efficiency";
import Complaints from "./pages/Admin/Complaints";




// ============ AUTH GUARD ============ //
const RequireAuth = ({ roles, children }) => {
  const { token, role } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// ============ DASHBOARD REDIRECTOR ============ //
const NavigateToRoleDashboard = () => {
  const { role } = useAuth();
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "leader") return <Navigate to="/leader" replace />;
  if (role === "employee" || role === "member") return <Navigate to="/employee" replace />;
  return <Navigate to="/login" replace />;
};

// ============ MAIN APP ============ //
const App = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginForm />} />

      {/* Protected routes with Layout */}
      <Route element={<Layout collapsed={collapsed} setCollapsed={setCollapsed} />}>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <RequireAuth roles={["admin"]}>
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/employee-list"
          element={
            <RequireAuth roles={["admin"]}>
              <EmployeeList />
            </RequireAuth>
          }
        />
        <Route
          path="/addEmployee"
          element={
            <RequireAuth roles={["admin"]}>
              <AddEmployee />
            </RequireAuth>
          }
        />
        <Route
          path="/teams"
          element={
            <RequireAuth roles={["admin"]}>
              <Teams />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth roles={["admin"]}>
              <Reports />
            </RequireAuth>
          }
        />
        <Route
          path="/complaints"
          element={
            <RequireAuth roles={["admin"]}>
              <Complaints />
            </RequireAuth>
          }
        />
        <Route
          path="/employee/:id"
          element={
            <RequireAuth roles={["admin"]}>
              <EmployeeDetails />
            </RequireAuth>
          }
        />

        {/* Leader Routes */}
        <Route
          path="/leader"
          element={
            <RequireAuth roles={["leader"]}>
              <TeamLeaderDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/leader/tasks"
          element={
            <RequireAuth roles={["leader"]}>
              <Tasks />
            </RequireAuth>
          }
        />
        <Route
          path="/leader/behavioral"
          element={
            <RequireAuth roles={["leader"]}>
              <ManagerBehavioral />
            </RequireAuth>
          }
        />
        <Route
          path="/leader/reports"
          element={
            <RequireAuth roles={["leader"]}>
              <LeaderReports />
            </RequireAuth>
          }
        />
        <Route
          path="/leader/evaluations"
          element={
            <RequireAuth roles={["leader"]}>
              <AllEvaluations />
            </RequireAuth>
          }
        />

        {/* Employee / Member Routes */}
        <Route
          path="/employee"
          element={
            <RequireAuth roles={["employee", "member"]}>
              <EmployeeDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/self-evaluation"
          element={
            <RequireAuth roles={["employee", "member"]}>
              <SelfEvaluation />
            </RequireAuth>
          }
        />
        <Route
          path="/peerEvaluation"
          element={
            <RequireAuth roles={["employee", "member"]}>
              <PeerEvaluation />
            </RequireAuth>
          }
        />
        <Route
          path="/my-reports"
          element={
            <RequireAuth roles={["employee", "member"]}>
              <EmployeeReports />
            </RequireAuth>
          }
        />

        {/* Common Routes */}
        <Route
          path="/profile"
          element={
            <RequireAuth roles={["admin", "leader", "employee", "member"]}>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/attendance"
          element={
            <RequireAuth roles={["admin", "leader", "employee", "member"]}>
              <AttendanceCamera />
            </RequireAuth>
          }
        />
        <Route
          path="/efficiency"
          element={
            <RequireAuth roles={["admin", "leader", "employee", "member"]}>
              <Efficiency />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth roles={["admin", "leader", "employee", "member"]}>
              <Settings />
            </RequireAuth>
          }
        />

        {/* Default route for logged in users */}
        <Route
          path="/"
          element={
            <RequireAuth roles={["admin", "leader", "employee", "member"]}>
              <NavigateToRoleDashboard />
            </RequireAuth>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
