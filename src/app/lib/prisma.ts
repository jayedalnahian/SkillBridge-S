import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { envVars } from "../config/env";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${envVars.DATABASE_URL}`;

const pool = new Pool({ connectionString });
pool.on('connect', (client) => {
  client.query("SET search_path TO sample, public;");
});

const adapter = new PrismaPg(pool);
const prisma: PrismaClient = new PrismaClient({ adapter });

export { prisma };
