import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContext {
    tenantId: string | null;
    role: string | null;
}

export const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext | undefined {
    return tenantStorage.getStore();
}

/**
 * Helper to run code within a specific tenant context
 */
export function withTenantContext<T>(context: TenantContext, fn: () => T): T {
    return tenantStorage.run(context, fn);
}
