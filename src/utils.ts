import bcrypt from "bcryptjs";

/**
 * Validates CPF using the official digits verification algorithm.
 */
export function validateCpf(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, "");
  if (cleanCpf.length !== 11) return false;
  
  // All digits equal is invalid
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  // Validate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(cleanCpf.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== Number(cleanCpf.charAt(9))) return false;

  // Validate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cleanCpf.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== Number(cleanCpf.charAt(10))) return false;

  return true;
}

/**
 * Dynamically formats a numeric input into the standard CPF pattern: 000.000.000-00
 */
export function formatCpf(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Dynamically formats a numeric input into the standard CEP pattern: 00.000-000
 */
export function formatCep(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Safe password hashing using bcryptjs.
 */
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

/**
 * Validates a plain password against a bcrypt hash. Supports plain text fallback for backward compatibility.
 */
export function comparePassword(plain: string, hash: string): boolean {
  if (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$")) {
    try {
      return bcrypt.compareSync(plain, hash);
    } catch {
      return plain === hash;
    }
  }
  return plain === hash;
}

/**
 * Generates a cryptographically strong unique reset token.
 */
export function generateResetToken(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => dec.toString(16).padStart(2, "0")).join("");
}

/**
 * Simple client-side Rate Limiting for recovery requests.
 * Blocks requests if there were too many attempts in a short period.
 */
export function checkRateLimit(email: string): { allowed: boolean; waitSeconds: number } {
  const rawLimits = localStorage.getItem("cc_recovery_rate_limits");
  const limits = rawLimits ? JSON.parse(rawLimits) : {};
  const now = Date.now();
  
  if (limits[email]) {
    const lastTime = limits[email];
    const diff = (now - lastTime) / 1000;
    if (diff < 60) {
      return { allowed: false, waitSeconds: Math.ceil(60 - diff) };
    }
  }
  
  limits[email] = now;
  localStorage.setItem("cc_recovery_rate_limits", JSON.stringify(limits));
  return { allowed: true, waitSeconds: 0 };
}

/**
 * Logs a high-integrity security audit event in local storage.
 */
export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  email: string;
}

export function logAuditEvent(action: string, email: string, details: string) {
  const rawLogs = localStorage.getItem("cc_security_audit_logs");
  const logs: AuditLog[] = rawLogs ? JSON.parse(rawLogs) : [];
  
  const newLog: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    action,
    details,
    email,
  };
  
  logs.unshift(newLog); // Put most recent at top
  localStorage.setItem("cc_security_audit_logs", JSON.stringify(logs.slice(0, 100))); // Keep last 100 logs
}
