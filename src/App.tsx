import React, { useState, useEffect } from 'react';
import { store, AppState } from './lib/store';
import { Language, getCategoryT } from './lib/i18n';
import { Navbar } from './components/common/Navbar';
import { HomePage } from './components/home/HomePage';
import { CategoryLanding } from './components/home/CategoryLanding';
import { UnifiedLogin } from './components/auth/UnifiedLogin';
import { JoinCategory } from './components/auth/JoinCategory';
import { AdminLogin } from './components/admin/AdminLogin';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import { WorkerDashboard } from './components/worker/WorkerDashboard';
import { UserProfilePage } from './components/profile/UserProfilePage';
import { AdminPortal } from './components/admin/AdminPortal';
import { EstateMapView } from './components/maps/EstateMapView';
import { WorkspaceHub } from './components/workspace/WorkspaceHub';
import { usesBackend } from './lib/authApi';
import { SyncErrorBanner } from './components/common/SyncErrorBanner';
import { CategoryProvider } from './config/CategoryContext';
import { DEFAULT_CATEGORY, activeLegacyRoleIn, capabilityOfLegacyRole } from './config/categories';
import { HOME, lastCategory, navigate, rememberCategory, routeCategory, useRoute } from './lib/router';
import type { CategoryRoleId } from './types/category';

export default function App() {
  const [state, setState] = useState<AppState>(store.getState());
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    const saved = localStorage.getItem('coconnect_lang') as Language;
    return saved === 'si' || saved === 'ta' || saved === 'en' ? saved : 'en';
  });

  const route = useRoute();
  const category = routeCategory(route);

  // Role pre-selected by a landing-page card; used by the sign-in screen.
  const [preselectedRoleId, setPreselectedRoleId] = useState<CategoryRoleId | undefined>();

  const t = getCategoryT(currentLang, category);

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

    // Pre-category link: /admin (path, not hash) opens the staff sign-in.
    if (window.location.pathname.toLowerCase() === '/admin' && !window.location.hash) {
      navigate({ page: 'admin' }, { replace: true });
    }

    // Live Supabase sync (users, estates, jobs, bids, ...) once real auth is on; see authApi.usesBackend
    const stopSync = usesBackend ? store.startSync() : undefined;

    return () => {
      unsubscribe();
      stopSync?.();
    };
  }, []);

  // Remember the last category so the pre-category #/login link and the navbar land somewhere sensible.
  useEffect(() => {
    if (category) rememberCategory(category);
  }, [category]);

  // Act in the role that belongs to the category being viewed (a user can be a client in
  // construction and a landowner in coconut).
  const user = state.currentUser;
  const viewedRole = category ? activeLegacyRoleIn(user, category) : null;
  useEffect(() => {
    if (user && viewedRole && user.active_role !== viewedRole && user.active_role !== 'admin') {
      store.switchRole(viewedRole);
    }
  }, [user?.id, user?.active_role, viewedRole]);

  /** Section names used by the navbar and dashboards, resolved against the current category. */
  const handleNavigate = (view: string) => {
    const target = category ?? lastCategory() ?? DEFAULT_CATEGORY;
    switch (view) {
      case 'home':
        navigate(HOME);
        break;
      case 'admin':
      case 'admin_login':
        navigate({ page: 'admin' });
        break;
      case 'login':
      case 'dashboard':
      case 'map':
      case 'profile':
      case 'workspace':
        navigate({ page: view, category: target });
        break;
      default:
        navigate(HOME);
    }
  };

  const openLogin = (roleId?: CategoryRoleId) => {
    setPreselectedRoleId(roleId);
    if (category) navigate({ page: 'login', category });
  };

  const renderRole = () => {
    if (!user || !category) return null;
    const capability = capabilityOfLegacyRole(viewedRole ?? undefined);
    // `key` remounts the dashboard when the category changes so its form defaults reset.
    switch (capability) {
      case 'poster':
        return <OwnerDashboard key={category} state={state} currentLang={currentLang} onNavigate={handleNavigate} />;
      case 'bidder':
        return <SupervisorDashboard key={category} state={state} currentLang={currentLang} />;
      case 'crew':
        return <WorkerDashboard key={category} state={state} currentLang={currentLang} />;
      default:
        return <JoinCategory currentLang={currentLang} />;
    }
  };

  const renderCurrentView = () => {
    // Staff area: sign-in, or the portal once signed in as admin.
    if (route.page === 'admin') {
      if (!user || !user.roles.includes('admin') || user.active_role !== 'admin') {
        return (
          <AdminLogin
            state={state}
            currentLang={currentLang}
            onLoginSuccess={() => navigate({ page: 'admin' })}
            onBackToHome={() => navigate(HOME)}
          />
        );
      }
      return <AdminPortal state={state} currentLang={currentLang} onExitAdmin={() => navigate(HOME)} />;
    }

    // Public home: pick a category.
    if (route.page === 'home') {
      return (
        <HomePage
          currentLang={currentLang}
          onSelectCategory={(id) => navigate({ page: 'category', category: id })}
          onLanguageChange={handleLanguageChange}
        />
      );
    }

    // Everything below belongs to a category.
    if (route.page === 'category') {
      return (
        <CategoryLanding
          state={state}
          currentLang={currentLang}
          onOpenLogin={openLogin}
          onExploreMap={() => navigate({ page: 'map', category: route.category })}
          onLanguageChange={handleLanguageChange}
          onBack={() => navigate(HOME)}
        />
      );
    }

    const loginScreen = (
      <UnifiedLogin
        currentLang={currentLang}
        initialRoleId={preselectedRoleId}
        onLoginSuccess={() => navigate({ page: 'dashboard', category: route.category })}
        onBackToHome={() => navigate({ page: 'category', category: route.category })}
        onSwitchCategory={() => navigate(HOME)}
      />
    );

    if (route.page === 'login') {
      return user && user.active_role !== 'admin' ? renderRole() : loginScreen;
    }

    // The map is public.
    if (route.page === 'map') {
      const leave = () =>
        navigate(user ? { page: 'dashboard', category: route.category } : { page: 'category', category: route.category });
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={leave} className="text-xs text-slate-400 hover:text-white flex items-center space-x-1">
              <span>← {user ? t.back_to_dashboard : t.back_to_home_btn}</span>
            </button>
            <span className="text-xs font-semibold text-emerald-400">{t.map_api_note}</span>
          </div>
          <EstateMapView state={state} currentLang={currentLang} onSelectEstate={leave} onSelectJob={leave} />
        </div>
      );
    }

    // Protected pages need a signed-in user.
    if (!user) return loginScreen;
    if (user.active_role === 'admin') {
      return <AdminPortal state={state} currentLang={currentLang} onExitAdmin={() => navigate(HOME)} />;
    }

    if (route.page === 'workspace') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ page: 'dashboard', category: route.category })}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <span>← {t.back_to_dashboard}</span>
            </button>
            <span className="text-xs font-semibold text-blue-400">{t.workspace_oauth_note}</span>
          </div>
          <WorkspaceHub state={state} currentLang={currentLang} />
        </div>
      );
    }

    if (route.page === 'profile') {
      return <UserProfilePage state={state} currentLang={currentLang} />;
    }

    return renderRole();
  };

  return (
    <CategoryProvider categoryId={category}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
        {usesBackend && <SyncErrorBanner syncError={state.syncError} currentLang={currentLang} />}

        <Navbar
          state={state}
          currentLang={currentLang}
          onLanguageChange={handleLanguageChange}
          onNavigate={handleNavigate}
          showAccount={route.page !== 'home'}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderCurrentView()}
        </main>

        {/* Architectural Footer */}
        <footer className="border-t border-slate-800 bg-slate-900/50 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span>{t.footer_brand}</span>
            </div>
            <div className="flex items-center space-x-3 font-mono text-[11px]">
              <span>{t.footer_escrow_gate}</span>
              <span>•</span>
              <span>{t.footer_dual_pin}</span>
              <span>•</span>
              <span>{t.footer_trilingual}</span>
            </div>
          </div>
        </footer>
      </div>
    </CategoryProvider>
  );
}
