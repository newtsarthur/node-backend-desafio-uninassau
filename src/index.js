import express from 'express';
import publicRoutes from './routes/public.js';
import privateRoutes from './routes/private.js';
import auth from './middlewares/auth.js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "https://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/', publicRoutes);
app.use('/', auth, privateRoutes);

app.listen(port, () => console.log(`Server rodando na porta ${port}`));