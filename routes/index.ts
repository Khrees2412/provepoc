import express, { type Router, type Request, type Response } from "express";
import { nanoid } from "nanoid";
import { db, insertVerification } from "../db.ts";
import crypto from "crypto";

const router: Router = express.Router();

interface RequestBody {
    kyc_level: string; // tier_1, tier_2, or tier_3
    bank_accounts: boolean; // true or false
    customer: {
        name: string;
        email: string;
        address: string;
        identity: {
            type: string;
            number: string;
        };
    };
    loan_amount?: number; // Amount requested
}

router.post("/verify", async (req: Request, res: Response) => {
    const { kyc_level, bank_accounts, customer } = req.body as RequestBody;
    if (!kyc_level || !bank_accounts || !customer) {
        res.status(400).json({ error: "Missing required fields" });
    }

    const id = nanoid(12);
    const reference = `loan-request-${id}`;

    try {
        const data = await initiateProve({
            kyc_level,
            bank_accounts,
            customer,
        });

        // Save to database
        insertVerification({
            id,
            full_name: customer.name,
            id_type: customer.identity.type,
            id_value: customer.identity.number,
            phone: customer.email, // Assuming email is used as a phone substitute
            loan_amount: 0, // Placeholder for loan amount
            status: "pending",
            mono_reference: reference,
            raw_response: JSON.stringify(data),
        });

        res.json({ reference, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to initiate verification" });
    }
});

const initiateProve = async (data: RequestBody): Promise<any> => {
    const id = nanoid(12);

    const url = "https://api.withmono.com/v1/prove/initiate";

    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({
                reference: `loan-request-${id}`,
                redirect_url: "https://getfunds.vercel.app/done",
                kyc_level: data.kyc_level,
                bank_accounts: data.bank_accounts,
                customer: data.customer,
            }),
            headers: { "Content-Type": "application/json" },
        });
        const res = await response.json();
        if (response.ok) {
            return res;
        } else {
            throw new Error(res.message);
        }
    } catch (error) {
        console.error(error);
    }
};

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

router.get("/status/:reference", (req: Request, res: Response) => {
    const { reference } = req.params;

    try {
        const verification = db.exec(`
            SELECT * FROM verifications WHERE mono_reference = '${reference}';
        `);

        if (!verification) {
            res.status(404).json({ error: "Verification not found" });
        }

        // Simulate loan decision
        const loanDecision =
            verification.status === "verified" ? "Approved" : "Rejected";

        res.json({
            success: true,
            message: "Verification status fetched successfully",
            verification,
            loanDecision,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch verification status" });
    }
});

export default router;
