import { describe, it, expect } from "vitest";
import {
  validatePasswordChange,
  getPasswordRules,
} from "@/lib/validate-password";

describe("getPasswordRules", () => {
  it("all rules fail for empty string", () => {
    const rules = getPasswordRules("");
    expect(rules.every((r) => !r.passed)).toBe(true);
  });

  it("length passes at 8 characters", () => {
    const rules = getPasswordRules("abcdefgh");
    expect(rules.find((r) => r.key === "length")?.passed).toBe(true);
  });

  it("length fails at 7 characters", () => {
    const rules = getPasswordRules("abcdefg");
    expect(rules.find((r) => r.key === "length")?.passed).toBe(false);
  });

  it("detects uppercase", () => {
    const rules = getPasswordRules("Password");
    expect(rules.find((r) => r.key === "uppercase")?.passed).toBe(true);
  });

  it("detects lowercase", () => {
    const rules = getPasswordRules("password");
    expect(rules.find((r) => r.key === "lowercase")?.passed).toBe(true);
  });

  it("detects digit", () => {
    const rules = getPasswordRules("pass1");
    expect(rules.find((r) => r.key === "digit")?.passed).toBe(true);
  });

  it("detects special character", () => {
    const rules = getPasswordRules("pass!");
    expect(rules.find((r) => r.key === "special")?.passed).toBe(true);
  });

  it("all rules pass for strong password", () => {
    const rules = getPasswordRules("Strong1!");
    expect(rules.every((r) => r.passed)).toBe(true);
  });
});

describe("validatePasswordChange", () => {
  it("returns first failing rule for weak password", () => {
    expect(validatePasswordChange("short", "short")).toBe(
      "Минимум 8 символов"
    );
  });

  it("returns error when passwords do not match", () => {
    expect(validatePasswordChange("Strong1!", "Strong2!")).toBe(
      "Пароли не совпадают"
    );
  });

  it("returns null for valid matching strong passwords", () => {
    expect(validatePasswordChange("Strong1!", "Strong1!")).toBeNull();
  });

  it("returns rule error before mismatch error", () => {
    expect(validatePasswordChange("abc", "xyz")).toBe("Минимум 8 символов");
  });

  it("rejects password without uppercase", () => {
    expect(validatePasswordChange("strong1!", "strong1!")).toBe(
      "Заглавная буква (A-Z)"
    );
  });

  it("rejects password without digit", () => {
    expect(validatePasswordChange("StrongPw!", "StrongPw!")).toBe(
      "Цифра (0-9)"
    );
  });

  it("rejects password without special character", () => {
    expect(validatePasswordChange("Strong1a", "Strong1a")).toBe(
      "Спецсимвол (!@#$%^&*…)"
    );
  });
});
