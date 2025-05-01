import express, {
    type Application,
    type Request,
    type Response,
} from "express";
import cors from "cors";
import dotenv from "dotenv";

import router from "./routes/index.ts";
dotenv.config();

export const MONO_SEC_KEY = process.env.MONO_PROVE_PROD_SEC_KEY as string;

const app: Application = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/v1", router);

app.get("/", (_: Request, res: Response) => {
    res.json({ message: "Hello World!" });
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Add graceful shutdown handling
process.on("unhandledRejection", (err) => {
    console.error("Unhandled rejection:", err);
    server.close(() => process.exit(1));
});

// Global error handler
app.use((err: Error, _: Request, res: Response, next: any) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
});
