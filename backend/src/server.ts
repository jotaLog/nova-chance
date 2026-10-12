import "dotenv/config";
import express from "express";
import { db } from "./config/database";
import userRoutes from "./routes/userRouter";
import clothesRoutes from "./routes/clothesRouter";

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

// app.get("/teste", (req, res) => {
//     res.send("teste");
// });

app.use("/users", userRoutes);
app.use("/clothes", clothesRoutes);

app.listen(3000, "0.0.0.0", () => {
  console.log("Servidor rodando na porta 3000");
});