import express from "express";
import { db } from "./config/database";
import userRoutes from "./routes/userRouter";

const app = express();

app.use(express.json());


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

app.use("/users", userRoutes);

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});