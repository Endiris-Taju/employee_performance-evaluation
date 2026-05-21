import {
  FiHome,
  FiCamera,
  FiUsers,
  FiLayers,
  FiFileText,
  FiCheckSquare,
  FiClipboard,
  FiSettings,
  FiTrendingUp,
  FiAward,
  FiZap,
  FiCalendar,
  FiUser,
} from "react-icons/fi";

export const ADMIN_NAV = [
  { to: "/admin", icon: FiHome, label: "Dashboard", end: true },
  { to: "/employee-list", icon: FiUsers, label: "Employees" },
  { to: "/addEmployee", icon: FiUser, label: "Add employee" },
  { to: "/teams", icon: FiLayers, label: "Teams" },
  { to: "/evaluations", icon: FiAward, label: "Evaluations" },
  { to: "/reports", icon: FiFileText, label: "Reports" },
  { to: "/attendance", icon: FiCamera, label: "Attendance" },
  { to: "/complaints", icon: FiClipboard, label: "Complaints" },
  { to: "/efficiency", icon: FiZap, label: "Efficiency" },
  { to: "/cycles", icon: FiCalendar, label: "Eval cycles" },
  { to: "/audit-log", icon: FiClipboard, label: "Audit log" },
];

export const LEADER_NAV = [
  { to: "/leader", icon: FiHome, label: "Dashboard", end: true },
  { to: "/leader/tasks", icon: FiCheckSquare, label: "Tasks" },
  { to: "/leader/behavioral", icon: FiAward, label: "Behavioral review" },
  { to: "/evaluations", icon: FiAward, label: "Evaluations" },
  { to: "/leader/reports", icon: FiFileText, label: "Reports" },
  { to: "/attendance", icon: FiCamera, label: "Attendance" },
  { to: "/efficiency", icon: FiZap, label: "Efficiency" },
  { to: "/self-evaluation", icon: FiUser, label: "Self evaluation" },
];

export const EMPLOYEE_NAV = [
  { to: "/employee", icon: FiHome, label: "Dashboard", end: true },
  { to: "/attendance", icon: FiCamera, label: "Attendance" },
  { to: "/self-evaluation", icon: FiAward, label: "Self evaluation" },
  { to: "/peerEvaluation", icon: FiUsers, label: "Peer evaluation" },
  { to: "/efficiency", icon: FiZap, label: "My efficiency" },
  { to: "/my-reports", icon: FiFileText, label: "My reports" },
];

export const NAV_SECONDARY = [
  { to: "/profile", icon: FiUser, label: "Profile" },
  { to: "/settings", icon: FiSettings, label: "Settings" },
];
