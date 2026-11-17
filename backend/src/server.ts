import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import { db } from "./config/database";
import userRoutes from "./routes/userRouter";
import clothesRoutes from "./routes/clothesRouter";
import postRoutes from "./routes/postRouter";
import messageRoutes from "./routes/messageRouter";
import { createMessage, initializeMessagesTable } from "./services/messageService";
import {
  initializePostsTable,
  postUploadsDirectory,
} from "./services/postService";
import {
  clothesUploadsDirectory,
  initializeClothesTables,
} from "./services/clothesService";
import { initializePasswordResetTable } from "./services/userService";

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: "*" },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const secret = process.env.JWT_SECRET;
  if (typeof token !== "string" || !secret) {
    return next(new Error("Autenticação necessária."));
  }

  try {
    const payload = jwt.verify(token, secret);
    if (
      typeof payload !== "object" ||
      payload === null ||
      !Number.isInteger(payload.id_usuario) ||
      payload.id_usuario <= 0
    ) {
      return next(new Error("Token inválido."));
    }

    socket.data.userId = payload.id_usuario;
    return next();
  } catch {
    return next(new Error("Sessão inválida ou expirada."));
  }
});

io.on("connection", (socket) => {
  const userId = Number(socket.data.userId);
  socket.join(`user:${userId}`);

  socket.on("message:send", async (input: unknown, acknowledge?: (result: unknown) => void) => {
    if (typeof acknowledge !== "function") return;
    if (
      typeof input !== "object" ||
      input === null ||
      !("recipientId" in input) ||
      !("message" in input)
    ) {
      acknowledge({ error: "Mensagem inválida." });
      return;
    }

    const recipientId = Number(input.recipientId);
    const content = typeof input.message === "string" ? input.message.trim() : "";
    if (
      !Number.isInteger(recipientId) ||
      recipientId <= 0 ||
      recipientId === userId ||
      !content ||
      content.length > 2000
    ) {
      acknowledge({ error: "Informe destinatário e mensagem válidos (até 2000 caracteres)." });
      return;
    }

    try {
      const savedMessage = await createMessage(userId, recipientId, content);
      io.to(`user:${recipientId}`).emit("message:new", savedMessage);
      acknowledge({ message: savedMessage });
    } catch (error: unknown) {
      console.error("Erro ao enviar mensagem em tempo real:", error);
      acknowledge({ error: "Não foi possível enviar a mensagem." });
    }
  });
});

app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use("/uploads/posts", express.static(postUploadsDirectory));
app.use("/uploads/clothes", express.static(clothesUploadsDirectory));


app.get("/", async (req, res) => {

  try {

    const [result] = await db.query(
      "SELECT 1"
    );

    res.json({
      message: "API funcionando",
      database: "conectado"
    });

  } catch(error){

    res.status(500).json({
      error: "Erro no banco"
    });

  }

});

// app.get("/teste", (req, res) => {
//     res.send("teste");
// });

app.use("/users", userRoutes);
app.use("/clothes", clothesRoutes);
app.use("/posts", postRoutes);
app.use("/messages", messageRoutes);

async function startServer() {
  await initializeClothesTables();
  await initializePostsTable();
  await initializeMessagesTable();
  await initializePasswordResetTable();
  httpServer.listen(3000, "0.0.0.0", () => {
    console.log("Servidor rodando na porta 3000");
  });
}

void startServer().catch((error: unknown) => {
  console.error("Não foi possível iniciar o servidor:", error);
  process.exitCode = 1;
});