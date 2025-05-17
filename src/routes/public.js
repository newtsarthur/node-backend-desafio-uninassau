import express from 'express';
import { register, login } from '../controllers/users/userController.js';

import auth from '../middlewares/auth.js'; 

const router = express.Router();


export default router;