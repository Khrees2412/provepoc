import express, { type Router, type Request, type Response } from "express";
import crypto from "crypto";
import { db } from "../db.ts";
import type {
    VerificationInitiated,
    VerificationCancelled,
    VerificationExpired,
} from "../types.ts";
import { MONO_SEC_KEY } from "../index.ts";

const router: Router = express.Router();

const validateWebhookSignature = (req: Request, secret: string): boolean => {
    const signature = req.headers["x-mono-signature"] as string;
    const payload = JSON.stringify(req.body);
    const hash = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
    return signature === hash;
};

router.post("/webhooks/mono", async (req: Request, res: Response) => {
    if (!validateWebhookSignature(req, MONO_SEC_KEY)) {
        res.status(401).send("Invalid signature");
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
                db.exec(`
                    UPDATE verifications
                    SET status = 'verified', raw_response = '${JSON.stringify(
                        successful
                    )}'
                    WHERE mono_reference = '${successful.reference}';
                `);

                break;
            case "mono.prove.data_verification_cancelled":
                const cancelled = data as unknown as VerificationCancelled;
                console.log("verification cancelled: ", cancelled);
                db.exec(`
                    UPDATE verifications
                    SET status = 'cancelled', raw_response = '${JSON.stringify(
                        cancelled
                    )}'
                    WHERE mono_reference = '${cancelled.reference}';
                `);
                break;
            case "mono.prove.data_verification_expired":
                const expired = data as unknown as VerificationExpired;
                console.log("verification expired", expired);
                db.exec(`
                    UPDATE verifications
                    SET status = 'expired', raw_response = '${JSON.stringify(
                        expired
                    )}'
                    WHERE mono_reference = '${expired.reference}';
                `);
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
