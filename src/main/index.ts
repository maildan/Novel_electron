/**
 * Main process entry point for development
 * This file handles the TypeScript loading for the main process
 */

// Load environment variables first
import { config } from 'dotenv';
config();

// Import and initialize the main process
import './main';
