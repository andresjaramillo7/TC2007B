export interface PasswordPolicyResult {
    valid: boolean;
    message?: string;
}

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
    if (password.length < 12) {
        return { valid: false, message: 'Password must be at least 12 characters' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain an uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain a lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain a number' };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain a symbol' };
    }
    return { valid: true };
}
