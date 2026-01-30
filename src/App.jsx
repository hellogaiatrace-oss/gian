import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import TopBar from "./components/TopBar";
import { AuthProvider, useAuth } from "./services/useAuth";
import { I18nProvider, useI18n } from "./i18n/useI18n";

import LanguageGate from "./pages/LanguageGate";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import Settings from "./pages/Settings";
import Terms from "./pages/Terms";
import Carbon from "./pages/Carbon";
import Chat from "./pages/Chat";
import Tales from "./pages/Tales";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import MapPage from "./pages/MapPage";
import Support from "./pages/Support";

function RequireLang({ children }){
  const { asked } = useI18n();
  if(!asked) return <Navigate to="/language" replace />;
  return children;
}

function Guard({ children }){
  const { user, loading } = useAuth();
  if(loading) return <div className="container"><small className="muted">Yükleniyor…</small></div>;
  if(!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App(){
  return (
    <I18nProvider>
      <AuthProvider>
        <div className="container">
          <TopBar />
          <div style={{ height: 14 }} />
          <Routes>
            <Route path="/language" element={<LanguageGate />} />

            <Route path="/" element={<RequireLang><Guard><Home /></Guard></RequireLang>} />
            <Route path="/auth" element={<RequireLang><AuthPage /></RequireLang>} />
            <Route path="/settings" element={<RequireLang><Guard><Settings /></Guard></RequireLang>} />
            <Route path="/terms" element={<RequireLang><Terms /></RequireLang>} />
            <Route path="/carbon" element={<RequireLang><Guard><Carbon /></Guard></RequireLang>} />
            <Route path="/chat" element={<RequireLang><Guard><Chat /></Guard></RequireLang>} />
            <Route path="/tales" element={<RequireLang><Guard><Tales /></Guard></RequireLang>} />
            <Route path="/map" element={<RequireLang><Guard><MapPage /></Guard></RequireLang>} />
            <Route path="/support" element={<RequireLang><Guard><Support /></Guard></RequireLang>} />
            <Route path="/profile" element={<RequireLang><Guard><Profile /></Guard></RequireLang>} />
            <Route path="/admin" element={<RequireLang><Guard><Admin /></Guard></RequireLang>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <div style={{ height: 18 }} />
          <small className="muted">GaiaTrace • PWA hazır (manifest). Geliştirmeye açık modüler yapı.</small>
        </div>
      </AuthProvider>
    </I18nProvider>
  );
}
