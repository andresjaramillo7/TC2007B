import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/user.model', () => ({
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
}));

import app from '../src/app';
import { findUserByEmail, findUserById } from '../src/models/user.model';
import { config } from '../src/config';
import { authorizeRoles } from '../src/middlewares/authorizeRoles';

const PASSWORD_HASH = '$2b$10$TBNuZUpWGHirFcIpFsFLJeH8HiByk1cMsXSAfbigt/sf5ybFgY.ue';

const mockUsers = {
    teacher: {
        id: 1,
        email: 'teacher@example.com',
        password_hash: PASSWORD_HASH,
        nombre: 'Ana',
        apellido: 'López',
        rol: 'docente',
        foto_url: null,
        created_at: '2024-01-01T00:00:00.000Z',
    },
    tutor: {
        id: 2,
        email: 'tutor@example.com',
        password_hash: PASSWORD_HASH,
        nombre: 'Carlos',
        apellido: 'García',
        rol: 'tutor',
        foto_url: null,
        created_at: '2024-01-01T00:00:00.000Z',
    },
    admin: {
        id: 3,
        email: 'admin@example.com',
        password_hash: PASSWORD_HASH,
        nombre: 'María',
        apellido: 'Administrador',
        rol: 'admin',
        foto_url: null,
        created_at: '2024-01-01T00:00:00.000Z',
    },
};

function createToken(userId: number, role: string, expiresIn?: string): string {
    return jwt.sign({ userId, role }, config.jwt.secret, {
        expiresIn: expiresIn ?? '8h',
    } as jwt.SignOptions);
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe('GET /nonexistent', () => {
    it('should return 404 with fail status', async () => {
        const res = await request(app).get('/nonexistent');
        expect(res.status).toBe(404);
        expect(res.body.status).toBe('fail');
        expect(res.body.message).toBe('Route not found');
    });
});

describe('GET /api/auth/test', () => {
    it('should return 404 (auth routes are now specific, not catch-all)', async () => {
        const res = await request(app).get('/api/auth/test');
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Route not found');
    });
});

describe('GET /api/mobile/test', () => {
    it('should return 404 after migration to /api/movil/tutor', async () => {
        const res = await request(app).get('/api/mobile/test');
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Route not found');
    });
});

describe('GET /api/teacher/test', () => {
    it('should return 404 after migration to /api/web/docente', async () => {
        const res = await request(app).get('/api/teacher/test');
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Route not found');
    });
});

describe('POST /api/auth/login', () => {
    it('should return 200 + JWT + public user for valid teacher credentials', async () => {
        (findUserByEmail as jest.Mock).mockResolvedValue(mockUsers.teacher);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@example.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data.user).toEqual({
            id: 1,
            email: 'teacher@example.com',
            nombre: 'Ana',
            apellido: 'López',
            rol: 'docente',
            foto_url: null,
        });
        expect(res.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should return 200 + role tutor for valid tutor credentials', async () => {
        (findUserByEmail as jest.Mock).mockResolvedValue(mockUsers.tutor);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'tutor@example.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.data.user.rol).toBe('tutor');
    });

    it('should return 200 + role admin for valid admin credentials', async () => {
        (findUserByEmail as jest.Mock).mockResolvedValue(mockUsers.admin);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@example.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.data.user.rol).toBe('admin');
    });

    it('should return 401 for invalid password', async () => {
        (findUserByEmail as jest.Mock).mockResolvedValue(mockUsers.teacher);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@example.com', password: 'wrongpassword' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for unknown email with the same generic message', async () => {
        (findUserByEmail as jest.Mock).mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'unknown@example.com', password: 'password123' });

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password');
    });

    it('should return 400 for invalid email format', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'not-an-email', password: 'password123' });

        expect(res.status).toBe(400);
    });

    it('should return 400 for missing password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@example.com' });

        expect(res.status).toBe(400);
    });
});

describe('GET /api/auth/me', () => {
    it('should return 200 + user data with a valid token', async () => {
        (findUserById as jest.Mock).mockResolvedValue(mockUsers.teacher);
        const token = createToken(1, 'docente');

        const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data.user).toEqual({
            id: 1,
            email: 'teacher@example.com',
            nombre: 'Ana',
            apellido: 'López',
            rol: 'docente',
            foto_url: null,
        });
    });

    it('should return 401 without Authorization header', async () => {
        const res = await request(app).get('/api/auth/me');

        expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer invalid-token-here');

        expect(res.status).toBe(401);
    });

    it('should return 401 with expired token', async () => {
        const token = createToken(1, 'docente', '0s');

        const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
    });
});

describe('authorizeRoles middleware', () => {
    it('should call next() for allowed teacher role', () => {
        const middleware = authorizeRoles('docente', 'admin');
        const req = { user: { userId: 1, role: 'docente' } } as any;
        const res = {} as any;
        const next = jest.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should call next() for allowed admin role', () => {
        const middleware = authorizeRoles('admin');
        const req = { user: { userId: 3, role: 'admin' } } as any;
        const res = {} as any;
        const next = jest.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should throw Forbidden for a role that is not allowed', () => {
        const middleware = authorizeRoles('admin');
        const req = { user: { userId: 2, role: 'tutor' } } as any;
        const res = {} as any;
        const next = jest.fn();

        expect(() => middleware(req, res, next)).toThrow('Forbidden');
        expect(next).not.toHaveBeenCalled();
    });

    it('should throw Authentication required when no user is present', () => {
        const middleware = authorizeRoles('docente');
        const req = {} as any;
        const res = {} as any;
        const next = jest.fn();

        expect(() => middleware(req, res, next)).toThrow('Authentication required');
        expect(next).not.toHaveBeenCalled();
    });
});
