import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientPkg from "../generated/prisma/client.js";

import { envVars } from "../config/env.js";

const { PrismaClient } = prismaClientPkg as unknown as {
  PrismaClient: new (...args: any[]) => unknown;
};

const connectionString = `${envVars.DATABASE_URL}`;

const pool = new Pool({ connectionString });
pool.on('connect', (client) => {
  client.query("SET search_path TO sample, public;");
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }) as any;

export { prisma };
