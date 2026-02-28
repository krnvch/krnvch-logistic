import { describe, it, expect } from "vitest";
import { validatePasswordChange } from "@/lib/validate-password";

describe("validatePasswordChange", () => {
  it("returns error when password is too short", () => {
    expect(validatePasswordChange("12345", "12345")).toBe(
      "Пароль должен содержать минимум 6 символов"
    );
  });

  it("returns error when passwords do not match", () => {
    expect(validatePasswordChange("password1", "password2")).toBe(
      "Пароли не совпадают"
    );
  });

  it("returns null for valid matching passwords", () => {
    expect(validatePasswordChange("password", "password")).toBeNull();
  });

  it("returns short-password error before mismatch error", () => {
    expect(validatePasswordChange("abc", "xyz")).toBe(
      "Пароль должен содержать минимум 6 символов"
    );
  });

  it("accepts exactly 6 characters", () => {
    expect(validatePasswordChange("123456", "123456")).toBeNull();
  });
});
