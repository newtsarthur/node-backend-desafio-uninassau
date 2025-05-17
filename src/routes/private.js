import express from 'express';
import { deleteUser, updateUser } from '../controllers/users/userController.js';
import auth from '../middlewares/auth.js'; 

const router = express.Router();

//Delete user router
router.delete('/delete/:id', deleteUser);

//Update user router
router.put('/update/:id', auth, updateUser);

export default router;
