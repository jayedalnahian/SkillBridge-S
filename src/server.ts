import app from "./app";
import { prisma } from "./lib/prisma";
const PORT = process.env.PORT
const main = async () => {
    try {
        await prisma.$connect();
        console.log("Connected to the database successfully.");
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        })


    } catch (error) {
        console.log("An error occured: ", error);
        await prisma.$disconnect();
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}


main()