import pg from 'pg';
export interface QueryResultRow {
    [column: string]: any;
}
export interface PgExecutionResult {
    rows: QueryResultRow[];
    rowCount?: number | null;
}
export declare class PgDatabase {
    private pool;
    private isConnected;
    constructor();
    private initPool;
    getPool(): pg.Pool;
    /**
     * Helper that converts SQL with `?` parameter markers into PostgreSQL `$1, $2, $3` syntax
     */
    convertParamMarkers(sql: string): string;
    /**
     * Universal execute method matching the LibSQL/database.ts interface:
     * Accepts both execute(sql) and execute({ sql, args })
     */
    execute(statement: string | {
        sql: string;
        args?: any[];
    }): Promise<PgExecutionResult>;
    testConnection(): Promise<boolean>;
    ensureDatabaseExists(): Promise<void>;
    initSchema(): Promise<void>;
    seedData(): Promise<void>;
    getNextSequence(sequenceName: string): Promise<number>;
}
export declare const pgDatabase: PgDatabase;
