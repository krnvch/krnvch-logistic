import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { X, ChevronDown, ChevronUp, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile } from "@/hooks/use-profile";
import { validatePasswordChange } from "@/lib/validate-password";
import type { UserRole, Theme } from "@/types";

interface ProfilePageProps {
  session: Session;
}

export default function ProfilePage({ session }: ProfilePageProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { updateProfile, changePassword, saving, changingPassword } =
    useProfile();

  const metadata = session.user.user_metadata;
  const email = session.user.email ?? "";

  const [firstName, setFirstName] = useState(
    (metadata?.first_name as string) ?? ""
  );
  const [lastName, setLastName] = useState(
    (metadata?.last_name as string) ?? ""
  );
  const [role, setRole] = useState<UserRole>(
    (metadata?.role as UserRole) ?? "operator"
  );

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    setProfileError(null);
    try {
      await updateProfile({ firstName, lastName, role });
      toast.success("Профиль обновлён");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Не удалось сохранить"
      );
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    const validationError = validatePasswordChange(
      newPassword,
      confirmPassword
    );
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    try {
      await changePassword(email, currentPassword, newPassword);
      toast.success("Пароль изменён");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOpen(false);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Не удалось сменить пароль"
      );
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <X className="h-4 w-4" />
        </Button>
        <h1 className="font-heading text-lg font-semibold">Профиль</h1>
      </header>

      {/* Content */}
      <div className="mx-auto w-full max-w-lg flex-1 space-y-6 p-4">
        {/* Personal data card */}
        <Card>
          <CardHeader>
            <CardTitle>Личные данные</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Имя"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Фамилия"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Оператор</SelectItem>
                  <SelectItem value="worker">Работник</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">
                Оператор — полный доступ. Работник — только просмотр и
                отметка &laquo;Готово&raquo;.
              </p>
            </div>

            {profileError && (
              <p className="text-destructive text-sm">{profileError}</p>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance card */}
        <Card>
          <CardHeader>
            <CardTitle>Оформление</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(
                [
                  { value: "light", label: "Светлая", icon: Sun },
                  { value: "dark", label: "Тёмная", icon: Moon },
                  { value: "system", label: "Системная", icon: Monitor },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(value as Theme)}
                >
                  <Icon className="mr-1.5 h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Password change card */}
        <Card>
          <CardHeader>
            <button
              type="button"
              className="flex w-full items-center justify-between"
              onClick={() => setPasswordOpen((v) => !v)}
            >
              <CardTitle>Смена пароля</CardTitle>
              {passwordOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </CardHeader>
          {passwordOpen && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Текущий пароль</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Новый пароль</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Подтверждение пароля
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {passwordError && (
                <p className="text-destructive text-sm">
                  {passwordError}
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword
                    ? "Смена пароля..."
                    : "Сменить пароль"}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
