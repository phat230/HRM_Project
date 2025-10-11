import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Protected from "./components/Protected";

// Public
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import HRManagement from "./pages/admin/HRManagement";
import LeaveApproval from "./pages/admin/LeaveApproval";
import AttendanceManagement from "./pages/admin/AttendanceManagement";
import SalaryManagementAdmin from "./pages/admin/SalaryManagementAdmin";
import NotificationsAdmin from "./pages/admin/NotificationsAdmin";
import PerformanceReviewAdmin from "./pages/admin/PerformanceReviewAdmin";
import DocumentManagementAdmin from "./pages/admin/DocumentManagementAdmin";
import WorkScheduleAdmin from "./pages/admin/WorkScheduleAdmin";
import ChatAdmin from "./pages/admin/ChatAdmin";


// User
import UserDashboard from "./pages/user/UserDashboard";
import ProfileUpdate from "./pages/user/ProfileUpdate";
import LeaveRequest from "./pages/user/LeaveRequest";
import LeaveHistory from "./pages/user/LeaveHistory";
import Attendance from "./pages/user/Attendance";
import Chat from "./pages/user/Chat";
import Report from "./pages/user/Report";
import SalaryManagement from "./pages/user/SalaryManagement";
import NotificationsUser from "./pages/user/NotificationsUser";
import PerformanceReviewUser from "./pages/user/PerformanceReviewUser";
import DocumentManagementUser from "./pages/user/DocumentManagementUser";
import WorkScheduleUser from "./pages/user/WorkScheduleUser";
import ReportAdmin from "./pages/admin/ReportAdmin";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
{/* ================= ADMIN ================= */}
<Route
  path="/admin/chat"
  element={<Protected roles={["admin"]}><ChatAdmin /></Protected>}
/>
<Route
  path="/admin/dashboard"
  element={<Protected roles={["admin"]}><AdminDashboard /></Protected>}
/>
<Route
  path="/admin/hr-management"
  element={<Protected roles={["admin"]}><HRManagement /></Protected>}
/>
<Route
  path="/admin/leave-approval"
  element={<Protected roles={["admin"]}><LeaveApproval /></Protected>}
/>
<Route
  path="/admin/attendance-management"
  element={<Protected roles={["admin"]}><AttendanceManagement /></Protected>}
/>
<Route
  path="/admin/notifications"
  element={<Protected roles={["admin"]}><NotificationsAdmin /></Protected>}
/>
<Route
  path="/admin/salary-management"
  element={<Protected roles={["admin"]}><SalaryManagementAdmin /></Protected>}
/>
<Route
  path="/admin/performance-review"
  element={<Protected roles={["admin"]}><PerformanceReviewAdmin /></Protected>}
/>
<Route
  path="/admin/document-management"
  element={<Protected roles={["admin"]}><DocumentManagementAdmin /></Protected>}
/>
<Route
  path="/admin/work-schedule"
  element={<Protected roles={["admin"]}><WorkScheduleAdmin /></Protected>}
/>
<Route
  path="/admin/reports"
  element={<Protected roles={["admin"]}><ReportAdmin /></Protected>}
/>

          {/* ================= USER ================= */}
          <Route path="/user/dashboard" element={<Protected roles={["employee","manager"]}><UserDashboard /></Protected>} />
          <Route path="/user/profile-update" element={<Protected roles={["employee","manager"]}><ProfileUpdate /></Protected>} />
          <Route path="/user/leave-request" element={<Protected roles={["employee","manager"]}><LeaveRequest /></Protected>} />
          <Route path="/user/leave-history" element={<Protected roles={["employee","manager"]}><LeaveHistory /></Protected>} />
          <Route path="/user/attendance" element={<Protected roles={["employee","manager"]}><Attendance /></Protected>} />
          <Route path="/user/chat" element={<Protected roles={["employee","manager"]}><Chat /></Protected>} />
          <Route path="/user/report" element={<Protected roles={["employee","manager"]}><Report /></Protected>} />
          <Route path="/user/notifications" element={<Protected roles={["employee","manager"]}><NotificationsUser /></Protected>} />
          <Route path="/user/salary-management" element={<Protected roles={["employee","manager"]}><SalaryManagement /></Protected>} />
          <Route path="/user/performance-review" element={<Protected roles={["employee","manager"]}><PerformanceReviewUser /></Protected>} />
          <Route path="/user/document-management" element={<Protected roles={["employee","manager"]}><DocumentManagementUser /></Protected>} />
          <Route path="/user/work-schedule" element={<Protected roles={["employee","manager"]}><WorkScheduleUser /></Protected>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
