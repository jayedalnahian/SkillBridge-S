import app from "./app";
import { envVars } from "./config/env";


const PORT = envVars.PORT;


const bootstrap = () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        })
    } catch (error) {
        console.log(`failed to start server: `, error);
    }
}


bootstrap()