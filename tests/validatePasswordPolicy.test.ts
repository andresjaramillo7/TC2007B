import { validatePasswordPolicy } from '../src/utils/validatePasswordPolicy';

describe('validatePasswordPolicy', () => {
    it('should reject password shorter than 12 characters', () => {
        const result = validatePasswordPolicy('Ab1!xyz');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('12');
    });

    it('should reject password missing uppercase letter', () => {
        const result = validatePasswordPolicy('abcdef1234!@');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('uppercase');
    });

    it('should reject password missing lowercase letter', () => {
        const result = validatePasswordPolicy('ABCDEF1234!@');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('lowercase');
    });

    it('should reject password missing number', () => {
        const result = validatePasswordPolicy('Abcdefghijk!@');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('number');
    });

    it('should reject password missing symbol', () => {
        const result = validatePasswordPolicy('Abcdefghijk1');
        expect(result.valid).toBe(false);
        expect(result.message).toContain('symbol');
    });

    it('should accept a valid password', () => {
        const result = validatePasswordPolicy('Demo_Teacher1!');
        expect(result.valid).toBe(true);
        expect(result.message).toBeUndefined();
    });
});
