import express, {
    type Application,
    type Request,
    type Response,
} from "express";

import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import router from "./routes/index.ts";

const app: Application = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/v1", router);

app.get("/", (req: Request, res: Response) => {
    res.json({ message: "Hello World!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
