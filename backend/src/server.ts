import "dotenv/config";
import express from "express";
import { db } from "./config/database";
import userRoutes from "./routes/userRouter";
import clothesRoutes from "./routes/clothesRouter";
import postRoutes from "./routes/postRouter";
import {
  initializePostsTable,
  postUploadsDirectory,
} from "./services/postService";

const app = express();

app.use(express.json({ limit: "8mb" }));
app.use("/uploads/posts", express.static(postUploadsDirectory));


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

async function startServer() {
  await initializePostsTable();
  app.listen(3000, "0.0.0.0", () => {
    console.log("Servidor rodando na porta 3000");
  });
}

void startServer().catch((error: unknown) => {
  console.error("Não foi possível iniciar o servidor:", error);
  process.exitCode = 1;
});