// ─── Core client ──────────────────────────────────────────────────────────────
export { apiClient, get, post, patch, put, del, upload } from './client';
export type { ApiError } from './client';

// ─── Query keys ───────────────────────────────────────────────────────────────
export { queryKeys } from './queryKeys';

// ─── Request utilities ────────────────────────────────────────────────────────
export { cleanParams, todayRange, thisMonthRange } from './requestUtils';
export type { PaginationParams, PagedResponse, DateRangeParams, SortParams } from './requestUtils';

// ─── Typed API services ───────────────────────────────────────────────────────
export { authApi }          from './auth.api';
export { inventoryApi }     from './inventory.api';
export { purchasesApi }     from './purchases.api';
export { salesApi }         from './sales.api';
export { customersApi }     from './customers.api';
export { reportsApi }       from './reports.api';
export { financeApi }       from './finance.api';
export { settingsApi }      from './settings.api';
export { usersApi }         from './users.api';
export { rolesApi }         from './roles.api';
export { branchesApi }      from './branches.api';
export { warehousesApi }    from './warehouses.api';
export { locationsApi }     from './locations.api';
export { cashRegistersApi } from './cashRegisters.api';
export { suppliersApi }     from './suppliers.api';
export { productsApi }      from './products.api';
export { variantsApi }      from './variants.api';
export { identifiersApi }   from './identifiers.api';
export { labelsApi }        from './labels.api';
export { priceListsApi }    from './priceLists.api';
export { promotionsApi }    from './promotions.api';
export { transfersApi }     from './transfers.api';
export { receiptsApi }      from './receipts.api';
export { treasuryApi }      from './treasury.api';
export { paymentsApi }      from './payments.api';
export { invoicesApi }      from './invoices.api';
export { notificationsApi } from './notifications.api';
export { integrationsApi }  from './integrations.api';
export { auditApi }         from './audit.api';
export { returnsApi }       from './returns.api';
export { collectionsApi }   from './collections.api';
export { loyaltyApi }       from './loyalty.api';
export { giftCardsApi }     from './gift-cards.api';
export { posApi }           from './pos.api';
export { reservationsApi }  from './reservations.api';
export { storefrontApi }    from './storefront.api';
export { storefrontOrdersApi } from './storefront-orders.api';
