export interface PasswordRule {
  key: string;
  label: string;
  passed: boolean;
}

export function getPasswordRules(password: string): PasswordRule[] {
  return [
    {
      key: "length",
      label: "Минимум 8 символов",
      passed: password.length >= 8,
    },
    {
      key: "uppercase",
      label: "Заглавная буква (A-Z)",
      passed: /[A-Z]/.test(password),
    },
    {
      key: "lowercase",
      label: "Строчная буква (a-z)",
      passed: /[a-z]/.test(password),
    },
    {
      key: "digit",
      label: "Цифра (0-9)",
      passed: /\d/.test(password),
    },
    {
      key: "special",
      label: "Спецсимвол (!@#$%^&*…)",
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export type PasswordStrength = "weak" | "medium" | "strong";

export function getPasswordStrength(password: string): {
  level: PasswordStrength;
  score: number;
} {
  if (password.length === 0) return { level: "weak", score: 0 };
  const passed = getPasswordRules(password).filter((r) => r.passed).length;
  if (passed <= 2) return { level: "weak", score: 1 };
  if (passed <= 4) return { level: "medium", score: 2 };
  return { level: "strong", score: 3 };
}

export function validatePasswordChange(
  newPassword: string,
  confirmPassword: string
): string | null {
  const rules = getPasswordRules(newPassword);
  const failedRule = rules.find((r) => !r.passed);
  if (failedRule) {
    return failedRule.label;
  }
  if (newPassword !== confirmPassword) {
    return "Пароли не совпадают";
  }
  return null;
}
