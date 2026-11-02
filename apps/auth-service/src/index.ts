import express from "express";
import { config } from "./config";
import { healthRouter } from "./routes/health";

const app = express();

app.use(express.json());
app.use(healthRouter);

app.listen(config.port, () => {
  console.log(`auth-service listening on port ${config.port}`);
});
