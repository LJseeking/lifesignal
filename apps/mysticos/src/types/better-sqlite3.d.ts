declare module 'better-sqlite3' {
  export default class Database {
    constructor(filename: string, options?: any);
    prepare(sql: string): Statement;
    exec(sql: string): this;
    transaction(fn: (...args: any[]) => any): (...args: any[]) => any;
    pragma(sql: string, options?: any): any;
    checkpoint(databaseName?: string): any;
    function(name: string, fn: (...args: any[]) => any): this;
    aggregate(name: string, options: any): this;
    table(name: string, factory: any): this;
    loadExtension(path: string): this;
    close(): this;
    defaultSafeIntegers(toggle?: boolean): this;
    unsafeMode(toggle?: boolean): this;
    serialize(options?: any): Buffer;
    backup(destination: string, options?: any): Promise<any>;
  }

  interface Statement {
    run(...params: any[]): RunResult;
    get(...params: any[]): any;
    all(...params: any[]): any[];
    iterate(...params: any[]): IterableIterator<any>;
    pluck(toggle?: boolean): this;
    expand(toggle?: boolean): this;
    raw(toggle?: boolean): this;
    columns(): any[];
    bind(...params: any[]): this;
  }

  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }
}
