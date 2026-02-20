import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import WorkingGroupsPage from '@/pages/WorkingGroupsPage'
import MeetingsPage from '@/pages/MeetingsPage'
import MeetingDetailPage from '@/pages/MeetingDetailPage'
import DecisionsPage from '@/pages/DecisionsPage'
import TasksPage from '@/pages/TasksPage'
import IssuesPage from '@/pages/IssuesPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/gestao-de-decisoes">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/grupos" element={<WorkingGroupsPage />} />
            <Route path="/reunioes" element={<MeetingsPage />} />
            <Route path="/reunioes/:id" element={<MeetingDetailPage />} />
            <Route path="/decisoes" element={<DecisionsPage />} />
            <Route path="/tarefas" element={<TasksPage />} />
            <Route path="/issues" element={<IssuesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
