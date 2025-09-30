import express, { type Router, type Request, type Response } from "express";
import { db } from "../db.ts";
import type {
    VerificationInitiated,
    VerificationCancelled,
    VerificationExpired,
} from "../types.ts";

const getWebhookSecret = (): string => {
    const environment = process.env.NODE_ENV || "development";
    const secret =
        environment === "production"
            ? process.env.MONO_PROVE_PROD_WEBHOOK_SECRET
            : process.env.MONO_PROVE_DEV_WEBHOOK_SECRET;

    if (!secret) {
        throw new Error(
            `Webhook secret not found for ${environment} environment`
        );
    }

    return secret;
};

const webhookSecret = getWebhookSecret();
const router: Router = express.Router();

router.post("/webhooks/mono", async (req: Request, res: Response) => {
    const webhookHeaderSecret = req.headers["mono-webhook-secret"] as string;

    if (webhookHeaderSecret !== webhookSecret) {
        res.status(401).send("Invalid signature");
        console.error("Invalid signature");
        return;
    }
    const { event, data } = req.body;
    console.log("body: ", req.body);

    res.status(200).send("Webhook processed");
});
export default router;
