import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../constants';

const router = Router();

router.use((_req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_IMPLEMENTED).json({
    status: 'fail',
    message: 'Mobile endpoints not yet implemented',
  });
});

export default router;
