import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterMemberPage from './pages/RegisterMemberPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import MembersPage from './pages/admin/MembersPage';
import RedListPage from './pages/admin/RedListPage';
import PaymentsPage from './pages/admin/PaymentsPage';

import MemberHomePage from './pages/member/MemberHomePage';
import AttendanceHistoryPage from './pages/member/AttendanceHistoryPage';
import RenewalPage from './pages/member/RenewalPage';
import AddonsPage from './pages/member/AddonsPage';
import EditProfilePage from './pages/EditProfilePage';
import BmiCalculatorPage from './pages/BmiCalculatorPage';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/member/home'} replace />;
  }

  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-member" element={<RegisterMemberPage />} />

      {/* Protected App Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Navigate
              to={user?.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/member/home'}
              replace
            />
          }
        />

        {/* Admin Portal Routes */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/members"
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/red-list"
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <RedListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/payments"
          element={
            <ProtectedRoute requiredRole="ROLE_ADMIN">
              <PaymentsPage />
            </ProtectedRoute>
          }
        />

        {/* Member Portal Routes */}
        <Route
          path="member/home"
          element={
            <ProtectedRoute requiredRole="ROLE_MEMBER">
              <MemberHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="member/attendance"
          element={
            <ProtectedRoute requiredRole="ROLE_MEMBER">
              <AttendanceHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="member/renew"
          element={
            <ProtectedRoute requiredRole="ROLE_MEMBER">
              <RenewalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="member/addons"
          element={
            <ProtectedRoute requiredRole="ROLE_MEMBER">
              <AddonsPage />
            </ProtectedRoute>
          }
        />

        {/* Common Routes (Admin & Member) */}
        <Route
          path="bmi-calculator"
          element={
            <ProtectedRoute>
              <BmiCalculatorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="edit-profile"
          element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}