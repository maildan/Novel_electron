interface SecurityConfig {
    allowedOrigins: string[];
    allowedProtocols: string[];
    maxFileSize: number;
    enableCORS: boolean;
    strictMode: boolean;
}
/**
 * Convert file path to protocol URL
 */
export declare function filePathToProtocolUrl(filePath: string): string;
/**
 * Convert protocol URL to file path
 */
export declare function protocolUrlToFilePath(protocolUrl: string): string;
/**
 * Update security configuration
 */
export declare function updateSecurityConfig(config: Partial<SecurityConfig>): void;
/**
 * Add allowed origin
 */
export declare function addAllowedOrigin(origin: string): void;
/**
 * Remove allowed origin
 */
export declare function removeAllowedOrigin(origin: string): void;
/**
 * Initialize protocol handlers (must be called before app.ready)
 */
export declare function initProtocolSchemes(): void;
/**
 * Setup protocol handlers (call after app.ready)
 */
export declare function setupProtocolHandlers(): void;
/**
 * Cleanup protocol handlers
 */
export declare function cleanupProtocolHandlers(): void;
/**
 * Get protocol status
 */
export declare function getProtocolStatus(): {
    initialized: boolean;
    registeredProtocols: string[];
    securityConfig: SecurityConfig;
};
export {};
//# sourceMappingURL=protocols.d.ts.map