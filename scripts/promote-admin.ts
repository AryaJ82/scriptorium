import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

async function main() {
    const username = process.argv[2]?.trim();
    const databaseUrl = process.env.DATABASE_URL;

    if (!username) {
        throw new Error("Usage: npm run db:promote-admin -- <username>");
    }
    if (!databaseUrl) {
        throw new Error("DATABASE_URL must be set in .env");
    }

    const prisma = new PrismaClient({
        adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
    });

    try {
        const result = await prisma.user.updateMany({
            where: { username },
            data: { role: "ADMIN" },
        });

        if (result.count === 0) {
            throw new Error(`No user found with username "${username}"`);
        }

        console.log(`Granted admin role to "${username}".`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
