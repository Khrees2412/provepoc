import express, { type Router, type Request, type Response } from "express";
import { db, insertVerification } from "../db.ts";
import { z } from "zod";
import {
    getCustomer,
    initiateProve,
    revokeDataAccess,
    whitelistOrBlacklistCustomer,
} from "../services/index.ts";
import { type VerificationResponse } from "../types.ts";

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
    redirect_url: z.string(),
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
    const { kyc_level, bank_accounts, customer, loan_amount, redirect_url } =
        parseResult.data;

    try {
        const data = await initiateProve({
            kyc_level,
            bank_accounts,
            customer,
            redirect_url,
        });

        if (data.status === "successful") {
            insertVerification({
                id: data.data.reference,
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
            data: {
                reference: data.data.reference,
                mono_url: data.data.mono_url,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: `Failed to initiate verification, ${error}`,
        });
    }
});

router.get("/status/:reference", (req: Request, res: Response) => {
    const { reference } = req.params;

    try {
        const query = db.prepare(`
            SELECT * FROM verifications 
            WHERE mono_reference = ?
        `);

        const verification = query.get(reference) as VerificationResponse;

        if (!verification) {
            res.status(404).json({
                success: false,
                message: "Verification not found",
            });
            return;
        }
        if (verification.status !== "verified") {
            res.status(400).json({
                success: false,
                message: "Verification not completed or expired",
            });
            return;
        }

        res.json({
            success: true,
            message: "Loan status fetched successfully",
            data: {
                loanDecision: `Your application for a loan of ${turnKoboToNaira(
                    verification.loan_amount
                )} naira has been ${simulateLoanDecision(
                    verification.kyc_level,
                    verification.loan_amount
                )} `,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch verification status" });
    }
});

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

router.get("/customers/:reference", async (req: Request, res: Response) => {
    const { reference } = req.params;

    try {
        const data = await getCustomer(reference);

        if (data.status === "failed") {
            res.status(400).json({
                success: false,
                message: data.message,
                timestamp: data.timestamp,
            });
            return;
        }

        res.json({
            success: true,
            message: data.message,
            timestamp: data.timestamp,
            data: data.data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: `Failed to fetch customer details, error: ${error}`,
            timestamp: new Date().toISOString(),
        });
    }
});

router.delete("/customers/:reference", async (req: Request, res: Response) => {
    const { reference } = req.params;

    try {
        const data = await revokeDataAccess(reference);

        if (data.status === "failed") {
            res.status(400).json({
                success: false,
                message: data.message,
                timestamp: data.timestamp,
            });
            return;
        }

        res.json({
            success: true,
            message: data.message,
            timestamp: data.timestamp,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: `Failed to revoke customer data access, error: ${error}`,
            timestamp: new Date().toISOString(),
        });
    }
});

router.patch("/customers/:reference", async (req: Request, res: Response) => {
    const { reference } = req.params;
    const { action, reason, code } = req.body;

    try {
        const data = await whitelistOrBlacklistCustomer(
            action,
            reference,
            reason,
            code
        );

        if (data.status === "failed") {
            res.status(400).json({
                success: false,
                message: data.message,
                timestamp: data.timestamp,
            });
            return;
        }

        res.json({
            success: true,
            message: data.message,
            timestamp: data.timestamp,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: `Failed to update customer profile, error: ${error}`,
            timestamp: new Date().toISOString(),
        });
    }
});

export default router;
