import { Request, Response } from "express";
import { createUser } from "../services/userService";
import bcrypt from "bcrypt"; 
import jwt from "jsonwebtoken";
import { loginUser } from "../services/userService"; 


export async function registerUser(
   req: Request,
   res: Response
){
   try {
      const { nome, email, senha, cpf, foto_perfil, bio } = req.body;

      const senha_hash = await bcrypt.hash(senha, 10);

      const user = await createUser({ nome, email, senha_hash, cpf, foto_perfil, bio });

      res.status(201).json({ message: "Usuário registrado", user });

   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao registrar usuário" });
   }
}

export async function login(
   req:Request,
   res:Response
){

   try {
      const {
         email,
         senha
      }=req.body;

      const user = await loginUser(email);
      const senhaValida = await bcrypt.compare(
         senha,
         user.senha_hash
      );

      if(!senhaValida){
         return res.status(401).json({
            error:"Senha incorreta"
         });
      }

      const token = jwt.sign(
         {
            id_usuario:user.id_usuario,
            email:user.email
         },
            "SECRET_KEY",
         {
            expiresIn:"1d"
         }
      );

      res.json({
         message:"Login realizado", token,
         user:{
            id_usuario:user.id_usuario,
            nome:user.nome,
            email:user.email
         }
      });



   } catch(error) {
      console.log(error);
      res.status(500).json({
         error:"Erro no login"
      });
   }
}