import { Router } from 'express';
import { loginHandler, getMeHandler } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { validateRequest } from '../middlewares/validateRequest';
import { loginSchema } from '../validations/auth.validation';

const router = Router();

router.post('/login', validateRequest({ body: loginSchema }), loginHandler);
router.get('/me', authenticate, getMeHandler);

export default router;
