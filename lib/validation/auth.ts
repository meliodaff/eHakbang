/**
 * Hand-rolled auth form validation. No schema library is used elsewhere in
 * this codebase, and the checks needed here are small and static.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_PHONE_RE = /^(\+?63|0)9\d{9}$/;

export type FieldErrors = Record<string, string[]>;

export function validateFullName(value: string): string[] {
  const errors: string[] = [];
  if (value.trim().length < 2) errors.push("Full name must be at least 2 characters.");
  return errors;
}

export function validateEmail(value: string): string[] {
  const errors: string[] = [];
  if (!EMAIL_RE.test(value.trim())) errors.push("Enter a valid email address.");
  return errors;
}

export function validatePhone(value: string): string[] {
  const errors: string[] = [];
  if (!PH_PHONE_RE.test(value.trim().replace(/[\s-]/g, ""))) {
    errors.push("Enter a valid Philippine mobile number (e.g. 09171234567).");
  }
  return errors;
}

export function validatePassword(value: string): string[] {
  const errors: string[] = [];
  if (value.length < 8) errors.push("Password must be at least 8 characters.");
  return errors;
}

export function validateConfirmPassword(password: string, confirm: string): string[] {
  const errors: string[] = [];
  if (password !== confirm) errors.push("Passwords do not match.");
  return errors;
}
