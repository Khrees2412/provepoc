type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface VerificationInitiated {
    app: string;
    business: string;
    id: string;
    status: string;
    reference: string;
    created_at: Date;
    kyc_level: string;
    bank_accounts: boolean;
    is_blacklisted: boolean;
    meta: Meta;
}

export interface VerificationSuccessful {
    id: string;
    customer: Customer;
    reference: string;
    status: string;
    created_at: Date;
    kyc_level: string;
    bank_accounts: boolean;
    data_access: DataAccess;
    app: string;
    business: string;
}

export interface VerificationCancelled
    extends Omit<VerificationSuccessful, "data_access"> {}

export interface VerificationExpired {
    id: string;
    reference: string;
    status: "expired";
    created_at: string; // Or Date if you want to parse it
    kyc_level: string;
    bank_accounts: boolean;
    app: string;
    business: string;
    attempts: number;
    error_logs: ErrorLog[];
}

export interface ErrorLog {
    timestamp: number;
    message: string;
}
export interface Customer {
    id: string;
    name: string;
    email: string;
}

export interface DataAccess {
    start_date: null;
    end_date: null;
    type: string;
}

export interface Meta {
    ref: string;
}

export interface VerificationResponse {
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

export interface RequestBody {
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
    redirect_url?: string;
}

export interface InitiateResponseData {
    status: string;
    message: string;
    timestamp: Date;
    data: InitiateData;
}

export interface InitiateData {
    id: string;
    customer: string;
    mono_url: string;
    reference: string;
    redirect_url: string;
    bank_accounts: boolean;
    kyc_level?: string;
    is_blacklisted: boolean;
}
