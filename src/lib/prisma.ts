import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client';
import { UserRole } from "../middlewares/auth";
// import { async } from '../../node_modules/@better-auth/telemetry/src/project-id';


const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prismaBase = new PrismaClient({ adapter })

const prisma = prismaBase.$extends({
    query: {
        user: {
            async create({ args, query }) {
                // 1️⃣ Create the user first
                const user = await query(args);

                // 2️⃣ Ensure UserProfile exists
                await prismaBase.userProfile.upsert({
                    where: { userId: user.id as string },
                    update: {},
                    create: {
                        userId: user.id as string,
                        role: "STUDENT",
                        status: "ACTIVE",
                    },
                });

                return user;
            },
        },
    },
});


export { prisma }