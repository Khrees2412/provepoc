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
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/v1", router);

app.get("/", (_: Request, res: Response) => {
    res.json({ message: "Hello World!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
