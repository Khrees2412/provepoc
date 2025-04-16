import express, {
    type Application,
    type Request,
    type Response,
} from "express";

import router from "./routes/index.js";

const app: Application = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use("/v1", router);

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
