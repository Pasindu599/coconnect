import React, { useState, useEffect } from 'react';
import { store, AppState } from './lib/store';
import { Language } from './lib/i18n';
import { Navbar } from './components/common/Navbar';
import { UnifiedLogin } from './components/auth/UnifiedLogin';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import { WorkerDashboard } from './components/worker/WorkerDashboard';
import { UserProfilePage } from './components/profile/UserProfilePage';
import { AdminPortal } from './components/admin/AdminPortal';
import { Role } from './types';

export default function App() {
  const [state, setState] = useState<AppState>(store.getState());
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [activeView, setActiveView] = useState<string>('dashboard');

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState({ ...store.getState() });
    });
    return unsubscribe;
  }, []);

  const handleLoginSuccess = (role: Role) => {
    if (role === 'admin') {
      setActiveView('admin');
    } else {
      setActiveView('dashboard');
    }
  };

  const renderCurrentView = () => {
    // If not logged in, show unified login
    if (!state.currentUser) {
      return (
        <UnifiedLogin
          state={state}
          currentLang={currentLang}
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }

    // Isolated Admin Portal
    if (activeView === 'admin') {
      return (
        <AdminPortal
          state={state}
          currentLang={currentLang}
          onExitAdmin={() => setActiveView('dashboard')}
        />
      );
    }

    // Shared Profile Page (Requirement 8)
    if (activeView === 'profile') {
      return (
        <UserProfilePage
          state={state}
          currentLang={currentLang}
        />
      );
    }

    // Role-specific view routing (Requirement 1, 2, 3, 4)
    switch (state.currentUser.active_role) {
      case 'owner':
        return (
          <OwnerDashboard
            state={state}
            currentLang={currentLang}
          />
        );
      case 'supervisor':
        return (
          <SupervisorDashboard
            state={state}
            currentLang={currentLang}
          />
        );
      case 'worker':
        return (
          <WorkerDashboard
            state={state}
            currentLang={currentLang}
          />
        );
      case 'admin':
        return (
          <AdminPortal
            state={state}
            currentLang={currentLang}
            onExitAdmin={() => {
              store.switchRole('owner');
              setActiveView('dashboard');
            }}
          />
        );
      default:
        return (
          <OwnerDashboard
            state={state}
            currentLang={currentLang}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar
        state={state}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderCurrentView()}
      </main>

      {/* Persistent Architectural Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Coconnect Labour Hiring & Escrow Platform • Architecture Specification v2.1</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>FastAPI REST Monolith Spec</span>
            <span>•</span>
            <span>PostgreSQL btree_gist Overlap Guard</span>
            <span>•</span>
            <span>Escrow Contact Gate</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
