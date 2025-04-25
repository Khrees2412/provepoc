import { nanoid } from "nanoid";

const MONO_SEC_KEY = process.env.MONO_TEST_SEC_KEY!;

interface RequestBody {
    kyc_level: "tier_1" | "tier_2" | "tier_3";
    bank_accounts: boolean;
    customer: {
        name: string;
        email: string;
        address: string;
        identity: {
            type: string;
            number: string;
        };
    };
    loan_amount?: number;
}

export interface ResponseData {
    status: string;
    message: string;
    timestamp: Date;
    data: Data;
}

export interface Data {
    id: string;
    customer: string;
    mono_url: string;
    reference: string;
    redirect_url: string;
    bank_accounts: boolean;
    kyc_level?: string;
    is_blacklisted: boolean;
}

export const initiateProve = async (
    data: RequestBody
): Promise<ResponseData> => {
    const id = nanoid(16);
    const url = "https://api.withmono.com/v1/prove/initiate";

    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({
                reference: `loan-request-${id}`,
                redirect_url: "http://localhost:5500",
                kyc_level: data.kyc_level,
                bank_accounts: data.bank_accounts,
                customer: data.customer,
            }),
            headers: {
                "Content-Type": "application/json",
                "mono-sec-key": MONO_SEC_KEY,
            },
        });

        const res = await response.json();

        if (!response.ok) {
            throw new Error(res.message || "Failed to initiate prove");
        }

        return res as ResponseData;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unexpected error occurred");
    }
};

export const whitelistOrBlacklistCustomer = async () => {};

export const revokeDataAccess = async () => {};
