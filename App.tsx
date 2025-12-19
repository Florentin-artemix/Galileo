
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { PublicationsProvider } from './contexts/PublicationsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import TeamPage from './pages/TeamPage';
import PublicationsPage from './pages/PublicationsPage';
import SinglePublicationPage from './pages/SinglePublicationPage';
import BlogPage from './pages/BlogPage';
import SingleBlogPostPage from './pages/SingleBlogPostPage';
import EventsPage from './pages/EventsPage';
import SubmissionPage from './pages/SubmissionPage';
import ContactPage from './pages/ContactPage';
import ResourcesPage from './pages/ResourcesPage';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ViewerDashboard from './pages/ViewerDashboard';
import TestRolesPage from './pages/TestRolesPage';
import RequireRole from './components/RequireRole';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const ThemeEffect: React.FC = () => {
  const { theme } = useTheme();
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);
  return null;
};

const AppContent: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <ThemeEffect />
      <div className="bg-light-bg dark:bg-navy font-inter text-light-text dark:text-off-white min-h-screen flex flex-col transition-colors duration-300">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/publications" element={<PublicationsPage />} />
            <Route path="/publication/:id" element={<SinglePublicationPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<SingleBlogPostPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/submit"
              element={
                <RequireRole allowed={['STUDENT', 'ADMIN', 'STAFF']}>
                  <SubmissionPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <RequireRole allowed={['ADMIN', 'STAFF']}>
                  <AdminDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/student"
              element={
                <RequireRole allowed={['STUDENT', 'ADMIN', 'STAFF']}>
                  <StudentDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/staff"
              element={
                <RequireRole allowed={['STAFF', 'ADMIN']}>
                  <StaffDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/viewer"
              element={
                <RequireRole allowed={['VIEWER', 'STUDENT', 'STAFF', 'ADMIN']}>
                  <ViewerDashboard />
                </RequireRole>
              }
            />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            {/* Page de test - à supprimer en production */}
            <Route path="/test-roles" element={<TestRolesPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <PublicationsProvider>
            <AppContent />
          </PublicationsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};


export default App;