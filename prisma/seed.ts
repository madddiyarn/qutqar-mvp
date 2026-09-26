import "./env";
import { PrismaClient, type PrismaClient as PrismaClientType } from "@prisma/client";
import { pathToFileURL } from "node:url";

const prisma = new PrismaClient();

export const systemUsers = [
  {
    name: "Надзор Boltzzmann",
    role: "SUPERVISOR",
    email: "nadzor@boltzzmann.kz",
    passwordHash: "65fc349f7ead8012b8de5323e15c6e3b289517faf7098910e348453b9861573f"
  },
  {
    name: "Контроллер Boltzzmann",
    role: "CONTROLLER",
    email: "controller@boltzzmann.kz",
    passwordHash: "2f7945c2bd522579a10a0fe818f7a8764f63344a5d41eedc43117990e909d794"
  }
];

export async function seedWith(client: PrismaClientType) {
  for (const user of systemUsers) {
    await client.user.upsert({
      where: { email: user.email },
      update: user,
      create: user
    });
  }
}

export async function seed() {
  await seedWith(prisma);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
