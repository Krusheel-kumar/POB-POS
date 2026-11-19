export declare let isPostgresActive: boolean;
export declare const db: {
    execute: (statement: string | {
        sql: string;
        args?: any[];
    }) => Promise<import("./pgDatabase.js").PgExecutionResult | import("@libsql/client", { with: { "resolution-mode": "import" } }).ResultSet>;
};
export declare function initDatabase(): Promise<void>;
/**
 * Atomic Gapless Sequence Generator
 * Guarantees zero gaps for GST invoices and sequential KOT tickets
 */
export declare function getNextSequence(sequenceName: string): Promise<number>;
