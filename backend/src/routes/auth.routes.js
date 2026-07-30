import { Router } from 'express';
import { googleLogin, login, logout, refresh, register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/google', googleLogin);
router.post('/register', register);
router.post('/refresh', refresh);
router.post('/logout', logout);


export default router;
