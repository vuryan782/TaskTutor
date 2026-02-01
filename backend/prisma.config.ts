import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  // (optional but fine)
  migrations: {
    path: "prisma/migrations",
  },

  // ✅ this replaces datasource.url in schema.prisma
  datasource: {
    url: env("DATABASE_URL"),
  },
});
