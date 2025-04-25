import express, { type Router, type Request, type Response } from "express";
import { nanoid } from "nanoid";
import { db, insertVerification } from "../db.ts";
import { z } from "zod";
import { initiateProve } from "../services/index.ts";

const router: Router = express.Router();

const requestBodySchema = z.object({
    kyc_level: z.enum(["tier_1", "tier_2", "tier_3"]),
    bank_accounts: z.boolean(),
    customer: z.object({
        name: z.string(),
        email: z.string().email(),
        address: z.string(),
        identity: z.object({
            type: z.enum(["nin", "bvn"]),
            number: z.string().length(11),
        }),
    }),
    loan_amount: z.number().min(1000),
    monthly_income: z.number(),
});

router.post("/verify", async (req: Request, res: Response) => {
    const parseResult = requestBodySchema.safeParse(req.body);

    if (!parseResult.success) {
        res.status(400).json({
            error: "Invalid request body",
            details: parseResult.error.errors,
        });
        return;
    }
    const { kyc_level, bank_accounts, customer, loan_amount } =
        parseResult.data;

    const id = nanoid(12);
    const reference = `loan-request-${id}`;

    try {
        const data = await initiateProve({
            kyc_level,
            bank_accounts,
            customer,
        });

        if (data.status === "success") {
            insertVerification({
                id: reference,
                full_name: customer.name,
                id_type: customer.identity.type,
                id_value: customer.identity.number,
                email: customer.email,
                loan_amount,
                status: "pending",
                kyc_level: data.data.kyc_level!,
                is_blacklisted: data.data.is_blacklisted,
                bank_accounts: data.data.bank_accounts,
                customer_id: data.data.customer,
                mono_reference: data.data.reference,
                raw_response: JSON.stringify(data),
            });
        }

        res.json({
            success: true,
            message: "Verification initiated successfully",
            reference,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: `Failed to initiate verification, ${error}`,
        });
    }
});

interface VerificationResponse {
    id: string;
    full_name: string;
    id_type: string;
    id_value: string;
    email: string;
    loan_amount: number;
    status: string;
    mono_reference: string;
    kyc_level: string;
    is_blacklisted: boolean;
    bank_accounts: boolean;
    customer_id: string;
    raw_response: string;
    created_at: string;
    updated_at: string;
}

router.get("/status/:reference", (req: Request, res: Response) => {
    const { reference } = req.params;

    try {
        const query = db.query(`
            SELECT * FROM verifications WHERE mono_reference = '${reference}'
        `);

        const verification = query.get() as VerificationResponse;

        res.json({
            success: true,
            message: "Verification status fetched successfully",
            verification,
            loanDecision: `Your application for a loan of ${turnKoboToNaira(
                verification.loan_amount
            )} naira has been ${simulateLoanDecision(
                verification.kyc_level,
                verification.loan_amount
            )} `,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch verification status" });
    }
});

export default router;

const turnKoboToNaira = (amount: number): number => amount / 100;
type Decision = "Approved" | "Rejected";

const simulateLoanDecision = (
    kyc_level: string,
    loan_amount: number
): Decision => {
    const amountInNaira = turnKoboToNaira(loan_amount);

    const TIER_LIMITS = {
        tier_1: 100_000,
        tier_2: 10_000_000,
        tier_3: 100_000_000,
    };

    const tierLimit = TIER_LIMITS[kyc_level as keyof typeof TIER_LIMITS];

    if (!tierLimit) {
        return "Rejected";
    }

    return amountInNaira < tierLimit ? "Approved" : "Rejected";
};
