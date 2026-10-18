import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { registerSchema } from "../src/schemas/auth.schema.js";
import { registerUser } from "../src/services/auth.service.js";
import { ConflictError } from "../src/errors/AppError.js";

// Cria o primeiro admin. POST /auth/register exige login, então sem este
// seed não há como entrar no painel num banco novo.
async function main() {
  const data = registerSchema.parse({
    name: process.env.SEED_ADMIN_NAME ?? "Admin",
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
  });

  try {
    const user = await registerUser(data);
    console.log(`Admin criado: ${user.email}`);
  } catch (error) {
    if (error instanceof ConflictError) {
      console.log(`Admin já existe: ${data.email}`);
      return;
    }
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
