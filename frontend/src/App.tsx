import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LocaleProvider } from "./context/LocaleContext.jsx";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { SignupPage } from "./pages/SignupPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { TasksPage } from "./pages/TasksPage.jsx";
import { WeeklyPage } from "./pages/WeeklyPage.jsx";
import { DocumentsPage } from "./pages/DocumentsPage.jsx";
import { DocumentDetailPage } from "./pages/DocumentDetailPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";

export function App() {
  return (
    <AuthProvider>
      <LocaleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/weekly" element={<WeeklyPage />} />
              {/* Legacy routes — redirect to user-scoped URLs handled inside the pages */}
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/documents/:id" element={<DocumentDetailPage />} />
              {/* User-scoped document routes */}
              <Route path="/:userId/documents" element={<DocumentsPage />} />
              <Route path="/:userId/documents/:id" element={<DocumentDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </LocaleProvider>
    </AuthProvider>
  );
}

export default App;
