import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/login-form";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  const { session, loading, login, logout, isOperator } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage logout={logout} isOperator={isOperator} />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
