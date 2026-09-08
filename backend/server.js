import express from "express";
import cors from "cors";
import apiRouter from "./src/routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`Vyavsay backend listening on http://localhost:${PORT}`);
});
