import { nanoid } from "nanoid";
import { type RequestBody, type InitiateResponseData } from "../types";
import { MONO_SEC_KEY } from "../index";

const BASE_URL = "https://api.withmono.com/v1/prove";

export const initiateProve = async (
    data: RequestBody
): Promise<InitiateResponseData> => {
    const id = nanoid(16);
    const url = `${BASE_URL}/initiate`;

    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({
                reference: `loan-request-${id}`,
                redirect_url: data.redirect_url || "http://localhost:5500",
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

        return res as InitiateResponseData;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unexpected error occurred");
    }
};

export const whitelistOrBlacklistCustomer = async (
    action: boolean,
    reference: string
) => {
    let t = "whitelist";
    if (action) {
        t = "blacklist";
    }
    const url = `${BASE_URL}/customers/${t}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify({
                reference,
            }),
            headers: {
                "Content-Type": "application/json",
                "mono-sec-key": MONO_SEC_KEY,
            },
        });

        const res = await response.json();

        if (!response.ok) {
            throw new Error(res.message || `Failed to ${t} customer`);
        }

        return res;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unexpected error occurred");
    }
};

export const revokeDataAccess = async (
    reference: string
): Promise<any | Error> => {
    const url = `${BASE_URL}/customers/${reference}`;

    try {
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "mono-sec-key": MONO_SEC_KEY,
            },
        });

        const res = await response.json();

        if (!response.ok) {
            throw new Error(res.message || "Failed to revoke data access");
        }

        return res;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unexpected error occurred");
    }
};

export const getCustomer = async (reference: string): Promise<any | Error> => {
    const url = `${BASE_URL}/customers/${reference}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "mono-sec-key": MONO_SEC_KEY,
            },
        });

        const res = await response.json();

        if (!response.ok) {
            throw new Error(res.message || "Failed to get customer");
        }

        return res;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unexpected error occurred");
    }
};
