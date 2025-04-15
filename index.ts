import express, {
    type Application,
    type Request,
    type Response,
} from "express";

const app: Application = express();
const PORT = process.env.PORT || 3003;

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
