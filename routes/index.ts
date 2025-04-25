import mainrouter from "./main.ts";
import webhookrouter from "./webhook.ts";

import express, { type Router } from "express";

const router: Router = express.Router();

router.use(mainrouter);
router.use(webhookrouter);

export default router;
