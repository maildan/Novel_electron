export declare class StaticServer {
    private staticPath;
    private fallbackPort;
    private server;
    private port;
    constructor(staticPath: string, fallbackPort?: number);
    start(): Promise<number>;
    private handleRequest;
    private handleApiRequest;
    private serveFile;
    private send404;
    private send500;
    private getMimeType;
    stop(): Promise<void>;
    getUrl(): string;
}
//# sourceMappingURL=static-server.d.ts.map