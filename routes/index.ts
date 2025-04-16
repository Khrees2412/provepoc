import express, { type Router, type Request, type Response } from "express";
import { nanoid } from "nanoid";

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
}

router.post("/verify", async (req: Request, res: Response) => {
    const { kyc_level, bank_accounts, customer } = req.body as RequestBody;
    if (!kyc_level || !bank_accounts || !customer) {
        res.status(400).json({ error: "Missing required fields" });
    }
    const data = await initiateProve({
        kyc_level,
        bank_accounts,
        customer,
    });
    res.json(data);
});

const initiateProve = async (data: RequestBody) => {
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

router.post("/webhooks/mono", (req: Request, res: Response) => {
    switch (req.body.event) {
        case "mono.prove.data_verification_initiated":
            res.send("Loan Processed!");
            break;
        case "mono.prove.data_verification_successful":
            break;
        case "mono.prove.data_verification_cancelled":
            break;
        case "mono.prove.data_verification_expired":
            break;
        default:
            res.status(400).send("Unknown event");
    }
});

export default router;
