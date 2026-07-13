import { Request, Response } from "express";
import { createUser } from "../services/userService";


export async function registerUser(
   req: Request,
   res: Response
){
   try {
      const { nome, email, senha, cpf, foto_perfil, bio } = req.body;
      const user = await createUser({ nome, email, senha_hash: senha, cpf, foto_perfil, bio });

      res.status(201).json({ message: "Usuário registrado", user });

   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao registrar usuário" });
   }
}