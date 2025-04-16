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
