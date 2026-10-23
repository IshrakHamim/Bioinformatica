import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/auth';
import { Layout } from './components/Layout';
import { ToastHost } from './components/Toast';
import { currentUser, loadProgress } from './lib/progress';
import { startSync } from './lib/sync';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import ModulePage from './pages/ModulePage';
import ExamPage from './pages/ExamPage';
import FlashcardsPage from './pages/FlashcardsPage';
import GamesPage from './pages/GamesPage';
import GraphPage from './pages/GraphPage';
import MindMapsPage from './pages/MindMapsPage';
import GlossaryPage from './pages/GlossaryPage';
import SettingsPage from './pages/SettingsPage';

function Gate() {
  const { session } = useAuth();
  // load this user's saved progress before the first authenticated render
  if (session && currentUser() !== session.user) loadProgress(session.user);
  useEffect(() => {
    if (session) startSync(session.token);
  }, [session]);
  if (!session) return <Login />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/m/:id" element={<ModulePage />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:id" element={<GamesPage />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/mindmaps" element={<MindMapsPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Gate />
        <ToastHost />
      </HashRouter>
    </AuthProvider>
  );
}
