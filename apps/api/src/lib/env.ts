import { config } from "dotenv";

config({ path: ".env.local" });
config();

export const env = {
  port: Number(process.env.PORT ?? 4100),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
};
