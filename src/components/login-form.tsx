import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GridaLogo } from "@/components/grida-logo";

interface LoginFormProps {
  onLogin: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await onLogin(email, password);

    if (error) {
      setError(t("login.error"));
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="relative w-full max-w-sm">
        <div className="absolute top-4 right-4 flex gap-1.5 text-xs text-muted-foreground">
          <button
            type="button"
            className={`hover:text-foreground ${i18n.language === "en" ? "text-foreground font-medium" : ""}`}
            onClick={() => i18n.changeLanguage("en")}
          >
            EN
          </button>
          <span>/</span>
          <button
            type="button"
            className={`hover:text-foreground ${i18n.language === "ru" ? "text-foreground font-medium" : ""}`}
            onClick={() => i18n.changeLanguage("ru")}
          >
            RU
          </button>
        </div>
        <CardHeader>
          <GridaLogo size={48} showWordmark={false} className="text-primary" />
          <p className="text-muted-foreground text-sm">
            The grid sees everything.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="operator@grida.io"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  required
                  className="pr-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("login.loading") : t("login.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
