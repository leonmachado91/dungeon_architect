/**
 * Debug utility - only logs in development mode
 * Use instead of console.log for debug statements
 */
export const debug = {
    log: (...args: unknown[]) => {
        if (process.env.NODE_ENV === "development") {
            console.log(...args);
        }
    },
    warn: (...args: unknown[]) => {
        if (process.env.NODE_ENV === "development") {
            console.warn(...args);
        }
    },
    error: (...args: unknown[]) => {
        // Always log errors
        console.error(...args);
    },
};

export default debug;
