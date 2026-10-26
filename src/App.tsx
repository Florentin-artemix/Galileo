
import React, { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { PublicationsProvider } from './contexts/PublicationsContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import RequireRole from './components/RequireRole';

const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const PublicationsPage = lazy(() => import('./pages/PublicationsPage'));
const SinglePublicationPage = lazy(() => import('./pages/SinglePublicationPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const SingleBlogPostPage = lazy(() => import('./pages/SingleBlogPostPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const SubmissionPage = lazy(() => import('./pages/SubmissionPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const ReadingHistoryPage = lazy(() => import('./pages/ReadingHistoryPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AnalyticsDashboardPage = lazy(() => import('./pages/AnalyticsDashboardPage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const LearningPathsPage = lazy(() => import('./pages/LearningPathsPage'));

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
          <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/publications" element={<PublicationsPage />} />
              <Route path="/publication/:id" element={<SinglePublicationPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:id" element={<SingleBlogPostPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/submit"
                element={
                  <RequireRole allowed={['STUDENT', 'RESEARCHER', 'TEACHER', 'STAFF', 'ADMIN']}>
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
                  <RequireRole allowed={['STUDENT', 'RESEARCHER', 'TEACHER', 'STAFF', 'ADMIN']}>
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

              <Route path="/contact" element={<ContactPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              {/* Nouvelles pages - Exploitation microservices */}
              <Route
                path="/favorites"
                element={
                  <RequireRole allowed={['STUDENT', 'RESEARCHER', 'TEACHER', 'STAFF', 'ADMIN']}>
                    <FavoritesPage />
                  </RequireRole>
                }
              />
              <Route
                path="/history"
                element={
                  <RequireRole allowed={['STUDENT', 'RESEARCHER', 'TEACHER', 'STAFF', 'ADMIN']}>
                    <ReadingHistoryPage />
                  </RequireRole>
                }
              />
              <Route
                path="/notifications"
                element={
                  <RequireRole allowed={['STUDENT', 'RESEARCHER', 'TEACHER', 'STAFF', 'ADMIN']}>
                    <NotificationsPage />
                  </RequireRole>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RequireRole allowed={['ADMIN', 'STAFF']}>
                    <AnalyticsDashboardPage />
                  </RequireRole>
                }
              />
              {/* Assistant IA & Apprentissage Interactif */}
              <Route path="/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/quiz/:id" element={<QuizPage />} />
              <Route path="/learning-paths" element={<LearningPathsPage />} />
            </Routes>
          </Suspense>
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
