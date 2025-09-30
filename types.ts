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
        phone: string;
        email: string;
        address: string;
        identity?: {
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

interface NextOfKin {
    name: string;
    email: string;
    phoneNumber: string;
    relationship: string;
    address: string;
}

interface PersonalInfo {
    first_name: string;
    middle_name: string | null;
    last_name: string;
    next_of_kin: NextOfKin;
    email_addresses: string[];
    phone_numbers: string[];
    alternate_phone_number: string | null;
    date_of_birth: string;
    gender: "m" | "f" | "other";
    state_of_origin: string | null;
    state_of_residence: string | null;
    lga_of_origin: string | null;
    lga_of_residence: string | null;
    city: string | null;
    nationality: string;
    marital_status: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
    address_line_1: string | null;
    address_line_2: string | null;
}

interface CustomerDataAccess {
    last_access_date: string | null;
    start_date: string | null;
    end_date: string | null;
    type: "permanent" | "temporary";
}

interface Identity {
    id: string;
    number: string;
}

interface Institution {
    name: string;
    bank_code: string;
    nip_code: string;
}

interface Account {
    name: string;
    account_number: string;
    access_type: ("view" | "transfer" | "deposit")[];
    institution: Institution;
}

interface CustomerData {
    id: string;
    status: "active" | "inactive" | "pending";
    reference: string;
    data_access: CustomerDataAccess;
    personal_info: PersonalInfo;
    identities: Identity[];
    accounts: Account[];
}

export interface GenericResponse {
    status: "successful" | "failed";
    message: string;
    timestamp: string;
}

export type CustomerDetailsResponse = GenericResponse & {
    data: CustomerData;
};
