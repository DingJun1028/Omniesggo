 
// Minimal ambient type declarations for the `pg` (node-postgres) module.
// Installed in place of `@types/pg` (unavailable offline). Once `@types/pg`
// is installed, delete this file so the real types take over.
declare module 'pg' {
  export type PoolClient = {
    query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number | null }>;
    release(): void;
    [key: string]: any;
  };

  export class Pool {
    constructor(options?: any);
    connect(): Promise<PoolClient>;
    query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number | null }>;
    end(): Promise<void>;
    on(event: string, listener: (...args: any[]) => void): void;
  }

  export class Client {
    constructor(options?: any);
    connect(): Promise<void>;
    query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number | null }>;
    end(): Promise<void>;
  }
}
