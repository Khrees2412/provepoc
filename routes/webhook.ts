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
    try {
        switch (event) {
            case "mono.prove.data_verification_initiated":
                const initiated = data as unknown as VerificationInitiated;
                console.log("verification initiated: ", initiated);
                break;

            case "mono.prove.data_verification_successful":
                const successful = data as unknown as VerificationInitiated;
                console.log("verification successful: ", successful);
                const successStmt = db.prepare(`
                    UPDATE verifications
                    SET status = ?, raw_response = ?
                    WHERE mono_reference = ?;
                `);
                successStmt.run(
                    "verified",
                    JSON.stringify(successful),
                    successful.reference
                );
                break;

            case "mono.prove.data_verification_cancelled":
                const cancelled = data as unknown as VerificationCancelled;
                console.log("verification cancelled: ", cancelled);
                const cancelStmt = db.prepare(`
                    UPDATE verifications
                    SET status = ?, raw_response = ?
                    WHERE mono_reference = ?;
                `);
                cancelStmt.run(
                    "cancelled",
                    JSON.stringify(cancelled),
                    cancelled.reference
                );
                break;

            case "mono.prove.data_verification_expired":
                const expired = data as unknown as VerificationExpired;
                console.log("verification expired", expired);
                const expireStmt = db.prepare(`
                    UPDATE verifications
                    SET status = ?, raw_response = ?
                    WHERE mono_reference = ?;
                `);
                expireStmt.run(
                    "expired",
                    JSON.stringify(expired),
                    expired.reference
                );
                break;

            default:
                console.log("Unknown event type:", req.body);
                res.status(400).send("Unknown event");
                return;
        }
        res.status(200).send("Webhook processed");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to process webhook");
        return;
    }
});

export default router;
