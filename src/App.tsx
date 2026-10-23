import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastHost } from './components/Toast';
import { loadProgress } from './lib/progress';
import { startSync } from './lib/sync';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import ModulePage from './pages/ModulePage';
import FlashcardsPage from './pages/FlashcardsPage';
import GamesPage from './pages/GamesPage';
import GraphPage from './pages/GraphPage';
import MindMapsPage from './pages/MindMapsPage';
import GlossaryPage from './pages/GlossaryPage';
import SettingsPage from './pages/SettingsPage';

// No accounts for now: progress lives in this browser (plus optional Gist sync).
loadProgress('learner');

function Shell() {
  useEffect(() => {
    startSync();
  }, []);
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/m/:id" element={<ModulePage />} />
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
    <HashRouter>
      <Shell />
      <ToastHost />
    </HashRouter>
  );
}
