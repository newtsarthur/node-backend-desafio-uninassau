import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

//Create/Register new user
export const register = async (req, res) => {
  try {
    const user = req.body;

    //Check if user exist in db
    const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
    });

    if(existingUser) {
      return res.status(400).json({ message: "Já existe uma conta com esse email!" });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(user.password, salt);

    // Create user in db
    const userDB = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        adress: user.adress,
        password: hashPassword,
        createdAt: new Date(),
      }
    })

    //To do token JWT
    const token = jwt.sign({ id: userDB.id }, JWT_SECRET, {expiresIn: '7d' });

    // Return token and user info
    res.status(201).json({
      token,
      user: {
        id: userDB.id,
        name: userDB.name,
        email: userDB.email,
        createdAt: userDB.createdAt,
      },
    });
  } catch (error) {
    console.error("Erro ao tentar criar a conta", error)
    res.status(500).json({ message: "Erro no servidor.", error: error.message });
  }
};

//Login
export const login = async ( req, res ) => {
  try {
    const userInfo = req.body;

    //Search user in db
    const user = await prisma.user.findUnique({
      where: { email: userInfo.email }
    });

    //Check if user exist in db
    if (!user) {
      return res.status(404).json({ message: "Esse usuário não existe! "});
    }

    const isMatch = await bcrypt.compare(userInfo.password, user.password);

    //Check password saved with typed password
    if(!isMatch)
    {
      return res.status(400).json({ message: "Senha incorreta!" });
    }

    //Generate Token JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    //Return token and user info
    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        adress: user.adress,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error( "Erro ao tentar fazer login", error );
    res.status(500).json({ message: "Erro no servidor.", error: error.message });
  }
};

//Update user
export const updateUser = async ( req, res ) => {
  try {
    const userId = req.params.id;
    const token = req.headers.authorization?.split(' ')[1];

    if(!token) {
      return res.status(401).json({ message: "Token de autenticação não foi informado."});
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.id !== userId) {
      return res.status(403).json({ message: "Você não tem permissão atualizar esse usuário!" });
    }

    const { name, phone, adress, email, password } = req.body;
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
    
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Este email já está em uso por outro usuário!" });
      }
    }
    let hashedPassword;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        adress,
        email,
        ...(password && { password: hashedPassword }),
      },
    });
    res.status(200).json({
      message: "Usuário atualizado com sucesso",
      updatedUser,
    });
  } catch (error) {
    console.error( "Erro ao tentar fazer atualizar usuário", error );
    res.status(500).json({ message: "Erro no servidor.", error: error.message });
  }
}

//Delete user
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Token de autenticação não foi informado." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.id !== userId) {
      return res.status(403).json({ message: "Você não tem permissão para deletar este usuário!" });
    }
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({ message: "Usuário foi deletado com sucesso", deletedUser });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Token inválido" });
    }
    if (error.code === 'P2025') {
      return res.status(405).json({ message: "Usuário não encontrado!" });
    }
    res.status(500).json({ message: "Erro ao deletar usuário.", error: error.message });
  }
};