import app from "./app";
import { PORT } from "./config/config";


process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

app.listen(3000, () => {
  console.log(`Server is running on port ${3000}`);
  console.log(`http://localhost:${3000}`);
});