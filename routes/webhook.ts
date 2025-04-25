import express, { type Router, type Request, type Response } from "express";
import crypto from "crypto";
import { db } from "../db.ts";

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
    const secret = process.env.MONO_WEBHOOK_SECRET!;
    if (!validateWebhookSignature(req, secret)) {
        res.status(401).send("Invalid signature");
    }

    const { event, data } = req.body;

    try {
        switch (event) {
            case "mono.prove.data_verification_successful":
                // Update verification status to "verified"
                db.exec(`
                    UPDATE verifications
                    SET status = 'verified', raw_response = '${JSON.stringify(
                        data
                    )}'
                    WHERE mono_reference = '${data.reference}';
                `);
                break;
            case "mono.prove.data_verification_cancelled":
                // Update verification status to "cancelled"
                db.exec(`
                    UPDATE verifications
                    SET status = 'cancelled', raw_response = '${JSON.stringify(
                        data
                    )}'
                    WHERE mono_reference = '${data.reference}';
                `);
                break;
            case "mono.prove.data_verification_expired":
                // Update verification status to "expired"
                db.exec(`
                    UPDATE verifications
                    SET status = 'expired', raw_response = '${JSON.stringify(
                        data
                    )}'
                    WHERE mono_reference = '${data.reference}';
                `);
                break;
            default:
                res.status(400).send("Unknown event");
        }
        res.status(200).send("Webhook processed");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to process webhook");
    }
});

export default router;
