import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useThemeSync } from "@/hooks/use-theme-sync";
import { useLocaleSync } from "@/hooks/use-locale-sync";
import { LoginForm } from "@/components/login-form";
import ShipmentsPage from "@/pages/ShipmentsPage";
import ShipmentDetailPage from "@/pages/ShipmentDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  const { session, loading, login, logout, isOperator } = useAuth();
  useThemeSync(session);
  useLocaleSync(session);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <LoginForm onLogin={login} />;
  }

  const userEmail = session.user.email;
  const meta = session.user.user_metadata;
  const userInitials =
    [meta?.first_name as string, meta?.last_name as string]
      .filter(Boolean)
      .map((n) => n[0].toUpperCase())
      .join("") || userEmail?.charAt(0).toUpperCase() || "?";

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ShipmentsPage
            logout={logout}
            isOperator={isOperator}
            userEmail={userEmail}
            userInitials={userInitials}
          />
        }
      />
      <Route
        path="/shipments/:id"
        element={
          <ShipmentDetailPage
            logout={logout}
            isOperator={isOperator}
            userInitials={userInitials}
          />
        }
      />
      <Route
        path="/profile"
        element={
          <ProfilePage
            key={session.user.updated_at}
            session={session}
          />
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
