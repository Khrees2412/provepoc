import { Database } from "bun:sqlite";

export const db = new Database("db.sqlite");

db.exec(`  
    CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    full_name TEXT,
    id_type TEXT,
    id_value TEXT,
    phone TEXT,
    loan_amount REAL,
    status TEXT,
    mono_reference TEXT,
    raw_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

export const insertVerification = (verification: {
    id: string;
    full_name: string;
    id_type: string;
    id_value: string;
    phone: string;
    loan_amount: number;
    status: string;
    mono_reference: string;
    raw_response: string;
}) => {
    db.exec(`
      INSERT INTO verifications (
        id,
        full_name,
        id_type,
        id_value,
        phone,
        loan_amount,
        status,
        mono_reference,
        raw_response
      ) VALUES (
        '${verification.id}',
        '${verification.full_name}',
        '${verification.id_type}',
        '${verification.id_value}',
        '${verification.phone}',
        ${verification.loan_amount},    
        '${verification.status}',
        '${verification.mono_reference}',
        '${verification.raw_response}'
        );
        `);
};

export const getVerifications = () => {
    const verifications = db.exec(`
      SELECT * FROM verifications;
    `);
    return verifications;
};
export const getVerificationById = (id: string) => {
    const verification = db.exec(`
      SELECT * FROM verifications WHERE id = '${id}';
    `);
    return verification;
};
