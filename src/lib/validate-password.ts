export function validatePasswordChange(
  newPassword: string,
  confirmPassword: string
): string | null {
  if (newPassword.length < 6) {
    return "Пароль должен содержать минимум 6 символов";
  }
  if (newPassword !== confirmPassword) {
    return "Пароли не совпадают";
  }
  return null;
}
