import express from 'express';

import usersRouter from './users';

const router = express.Router();

router.use('/', express.static(process.env.STATIC_FILES_DIR!));
router.use('/users', usersRouter);
router.all('/*', (req, res): void => { res.status(404).json({ msg: 'invalid route' }); });

export default router;
