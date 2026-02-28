import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/login-form";
import ShipmentsPage from "@/pages/ShipmentsPage";
import ShipmentDetailPage from "@/pages/ShipmentDetailPage";
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

  const userEmail = session.user.email;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ShipmentsPage
            logout={logout}
            isOperator={isOperator}
            userEmail={userEmail}
          />
        }
      />
      <Route
        path="/shipments/:id"
        element={
          <ShipmentDetailPage logout={logout} isOperator={isOperator} />
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
