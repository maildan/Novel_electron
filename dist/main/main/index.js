"use strict";
/**
 * Main process entry point for development
 * This file handles the TypeScript loading for the main process
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables first
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// Import and initialize the main process
require('./main');
//# sourceMappingURL=index.js.map