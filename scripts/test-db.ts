import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing Prisma connection...");
    const clubs = await prisma.club.findMany();
    console.log("Connection successful! Clubs found:", clubs.length);
  } catch (error) {
    console.error("Prisma Connection Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
