import React, { useState, useEffect } from 'react';
import { store, AppState } from './lib/store';
import { Language } from './lib/i18n';
import { Navbar } from './components/common/Navbar';
import { LandingWebsite } from './components/home/LandingWebsite';
import { UnifiedLogin } from './components/auth/UnifiedLogin';
import { AdminLogin } from './components/admin/AdminLogin';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import { WorkerDashboard } from './components/worker/WorkerDashboard';
import { UserProfilePage } from './components/profile/UserProfilePage';
import { AdminPortal } from './components/admin/AdminPortal';
import { EstateMapView } from './components/maps/EstateMapView';
import { WorkspaceHub } from './components/workspace/WorkspaceHub';
import { subscribeToEstates, subscribeToJobs } from './lib/firebase';
import { Role } from './types';

export default function App() {
  const [state, setState] = useState<AppState>(store.getState());
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const saved = localStorage.getItem('coconnect_lang') as Language;
    return saved === 'si' || saved === 'ta' || saved === 'en' ? saved : 'en';
  });

  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || hash.includes('admin')) {
        return 'admin_login';
      }
    }
    // Default to public home website as requested
    return 'home';
  });

  const [preselectedRole, setPreselectedRole] = useState<Role>('owner');

  const handleLanguageChange = (newLang: Language) => {
    setCurrentLang(newLang);
    try {
      localStorage.setItem('coconnect_lang', newLang);
    } catch (e) {}
  };

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState({ ...store.getState() });
    });

    // Handle hash navigation
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('admin')) {
        const user = store.getState().currentUser;
        if (user && user.active_role === 'admin') {
          setActiveView('admin');
        } else {
          setActiveView('admin_login');
        }
      } else if (hash.includes('login')) {
        setActiveView('login');
      } else if (hash === '#/' || hash === '' || hash === '#') {
        // If logged in, can still stay or go to home
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    // Real-time Firestore synchronization
    const unsubEstates = subscribeToEstates((remoteEstates) => {
      if (remoteEstates && remoteEstates.length > 0) {
        const currentIds = new Set(store.getState().estates.map((e) => e.id));
        remoteEstates.forEach((re) => {
          if (!currentIds.has(re.id)) {
            store.getState().estates.unshift(re);
          }
        });
        setState({ ...store.getState() });
      }
    });

    const unsubJobs = subscribeToJobs((remoteJobs) => {
      if (remoteJobs && remoteJobs.length > 0) {
        const currentIds = new Set(store.getState().jobs.map((j) => j.id));
        remoteJobs.forEach((rj) => {
          if (!currentIds.has(rj.id)) {
            store.getState().jobs.unshift(rj);
          }
        });
        setState({ ...store.getState() });
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
      if (typeof unsubEstates === 'function') unsubEstates();
      if (typeof unsubJobs === 'function') unsubJobs();
    };
  }, []);

  const handleNavigate = (view: string) => {
    setActiveView(view);
    if (view === 'admin_login' || view === 'admin') {
      try { window.location.hash = '#/admin'; } catch (e) {}
    } else if (view === 'home') {
      try { window.location.hash = '#/'; } catch (e) {}
    } else if (view === 'login') {
      try { window.location.hash = '#/login'; } catch (e) {}
    }
  };

  const handleLoginSuccess = (role: Role) => {
    if (role === 'admin') {
      setActiveView('admin');
      try { window.location.hash = '#/admin'; } catch (e) {}
    } else {
      setActiveView('dashboard');
    }
  };

  const renderCurrentView = () => {
    // 1. Separate Admin Login (/admin)
    if (activeView === 'admin_login') {
      return (
        <AdminLogin
          state={state}
          currentLang={currentLang}
          onLoginSuccess={() => {
            setActiveView('admin');
            try { window.location.hash = '#/admin'; } catch (e) {}
          }}
          onBackToHome={() => handleNavigate('home')}
        />
      );
    }

    // 2. Staff Admin Portal
    if (activeView === 'admin') {
      if (!state.currentUser || !state.currentUser.roles.includes('admin')) {
        return (
          <AdminLogin
            state={state}
            currentLang={currentLang}
            onLoginSuccess={() => setActiveView('admin')}
            onBackToHome={() => handleNavigate('home')}
          />
        );
      }
      return (
        <AdminPortal
          state={state}
          currentLang={currentLang}
          onExitAdmin={() => handleNavigate('home')}
        />
      );
    }

    // 3. Public Home Website (as default home page with login button)
    if (activeView === 'home') {
      return (
        <LandingWebsite
          state={state}
          currentLang={currentLang}
          onOpenLogin={(role) => {
            if (role) setPreselectedRole(role);
            handleNavigate('login');
          }}
          onExploreMap={() => handleNavigate('map')}
          onLanguageChange={handleLanguageChange}
        />
      );
    }

    // 4. Standard User Login (Unified OTP)
    if (activeView === 'login') {
      return (
        <UnifiedLogin
          currentLang={currentLang}
          initialRole={preselectedRole}
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => handleNavigate('home')}
        />
      );
    }

    // Google Maps Estate & Job Map View
    if (activeView === 'map') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNavigate(state.currentUser ? 'dashboard' : 'home')}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <span>← {state.currentUser ? 'Back to Dashboard' : 'Back to Home'}</span>
            </button>
            <span className="text-xs font-semibold text-emerald-400">Google Maps Platform • Active Key Loaded</span>
          </div>
          <EstateMapView
            state={state}
            onSelectEstate={() => {
              handleNavigate(state.currentUser ? 'dashboard' : 'home');
            }}
            onSelectJob={() => {
              handleNavigate(state.currentUser ? 'dashboard' : 'home');
            }}
          />
        </div>
      );
    }

    // If user is not logged in and navigated to a protected view, show login
    if (!state.currentUser) {
      return (
        <UnifiedLogin
          currentLang={currentLang}
          initialRole={preselectedRole}
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => handleNavigate('home')}
        />
      );
    }

    // Google Workspace & Drive Backup Hub
    if (activeView === 'workspace') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNavigate('dashboard')}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <span>← Back to Dashboard</span>
            </button>
            <span className="text-xs font-semibold text-blue-400">OAuth 2.0 • Google Drive Backup & Firestore</span>
          </div>
          <WorkspaceHub state={state} />
        </div>
      );
    }

    // Shared Profile & NIC Page
    if (activeView === 'profile') {
      return (
        <UserProfilePage
          state={state}
          currentLang={currentLang}
        />
      );
    }

    // Role-specific view routing for logged-in users
    switch (state.currentUser.active_role) {
      case 'owner':
        return (
          <OwnerDashboard
            state={state}
            currentLang={currentLang}
            onNavigate={(view) => handleNavigate(view)}
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
            onExitAdmin={() => handleNavigate('home')}
          />
        );
      default:
        return (
          <OwnerDashboard
            state={state}
            currentLang={currentLang}
            onNavigate={(view) => handleNavigate(view)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar
        state={state}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onNavigate={handleNavigate}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderCurrentView()}
      </main>

      {/* Architectural Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span>Coconnect Labour Hiring & Escrow Platform • Sri Lanka</span>
          </div>
          <div className="flex items-center space-x-3 font-mono text-[11px]">
            <span>Escrow Contact Gate</span>
            <span>•</span>
            <span>Dual PIN Verification</span>
            <span>•</span>
            <span>Trilingual (EN / සිං / தம)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
