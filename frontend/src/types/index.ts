// ─── AUTH ────────────────────────────────────────────────────────────────
export interface LoginDto { email: string; password: string; }
export interface AuthUser {
  id: string; email: string; fullName: string;
  role: string; branchId?: string; permissions: Permission[];
}
export interface Permission { action: string; subject: string; }

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: Permission[];
  userCount?: number;
  createdAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  isMain: boolean;
  settings: {
    taxId?: string;
    posReceiptHeader?: string;
    posReceiptFooter?: string;
  };
  userCount?: number;
  createdAt: string;
}

export type WarehouseType = 'RETAIL' | 'STORAGE' | 'TRANSIT';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  branchId: string;
  type: WarehouseType;
  address?: string;
  isActive: boolean;
  createdAt: string;
  branchName?: string;
}

export type StorageLocationType = 'AREA' | 'RACK' | 'SHELF' | 'BIN';

export interface StorageLocation {
  id: string;
  code: string;
  name?: string;
  warehouseId: string;
  type: StorageLocationType;
  barcode?: string;
  isActive: boolean;
  createdAt: string;
  warehouseName?: string;
  branchName?: string;
}

export type CashRegisterStatus = 'OPEN' | 'CLOSED';

export interface CashRegister {
  id: string;
  name: string;
  branchId: string;
  isActive: boolean;
  status: CashRegisterStatus;
  currentOperatorId?: string;
  createdAt: string;
  branchName?: string;
  operatorName?: string;
}

export interface SystemUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  branchId?: string;
  branchName?: string;
  isActive: boolean;
  createdAt: string;
}

// ─── CATALOG ─────────────────────────────────────────────────────────────
export interface Category { id: string; name: string; parentId?: string | null; code?: string; }
export interface Brand    { id: string; name: string; }
export interface Attribute {
  id: string;
  name: string;
  values: AttributeValue[];
}
export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
}

export type ProductType = 'SINGLE' | 'VARIABLE' | 'COMBO';

export interface ProductComboLine {
  id?: string;
  childVariantId: string;
  quantity: number;
}

export interface Product {
  id: string; 
  name: string; 
  baseSku?: string;
  description?: string;
  categoryId: string; 
  brandId?: string;
  brand?: Brand;
  
  type: ProductType;
  manageBatches: boolean;
  isVariable: boolean; // Deprecated
  costPrice: number;
  
  basePrice?: number;
  taxRate?: number;
  variants?: ProductVariant[];
  comboLines?: ProductComboLine[];
  isActive: boolean; 
  isPublished: boolean;
  images: string[]; 
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ProductVariant {
  id: string; 
  productId: string; 
  sku: string; 
  barcode?: string;
  size?: string; 
  color?: string; 
  costPrice: number;
  basePrice: number; 
  isActive: boolean;
  attributes?: Record<string, string>;
  imageUrl?: string;
}

// ─── INVENTORY ───────────────────────────────────────────────────────────
export interface StockLevel {
  variantId: string; warehouseId: string; branchId: string;
  availableQuantity: number; reservedQuantity: number;
}
export interface InventoryMovement {
  id: string; variantId: string; type: string; quantity: number;
  unitCost?: number; referenceId: string; branchId: string; createdAt: string;
}

export type TransferStatus = 'DRAFT' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface TransferLine {
  variantId: string;
  quantity: number;
  receivedQuantity?: number;
  variantSku?: string;
  productName?: string;
}

export interface StockTransfer {
  id: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: TransferStatus;
  lines: TransferLine[];
  trackingNumber?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
  sourceWarehouseName?: string;
  destinationWarehouseName?: string;
}

// ─── PURCHASING ──────────────────────────────────────────────────────────
export type POStatus = 'DRAFT'|'ISSUED'|'PARTIALLY_RECEIVED'|'COMPLETED'|'CANCELLED';
export interface PurchaseOrder {
  id: string; supplierId: string; supplierName?: string; status: POStatus;
  lines: POLine[]; totalAmount: number; expectedDeliveryDate?: string; createdAt: string;
}
export interface POLine {
  variantId: string; variantSku?: string; productName?: string;
  orderedQuantity: number; receivedQuantity: number; unitCost: number;
}

export type ReceiptStatus = 'DRAFT' | 'DISPUTED' | 'VALIDATED';

export interface GoodsReceiptLine {
  id: string;
  poLineItemId: string;
  variantId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  difference: number;
  notes?: string;
  variantSku?: string;
  productName?: string;
}

export interface GoodsReceipt {
  id: string;
  purchaseOrderId: string;
  destinationWarehouseId: string;
  receivedByUserId: string;
  status: ReceiptStatus;
  lines: GoodsReceiptLine[];
  createdAt: string;
  updatedAt: string;
}

// ─── SALES ───────────────────────────────────────────────────────────────
export type PaymentMethod = 'CASH'|'CREDIT_CARD'|'CUSTOMER_CREDIT'|'BANK_TRANSFER'|'MULTIPLE'|'QR_MERCADOPAGO';
export interface PaymentMethodEntity { id: string; name: string; type: string; isActive: boolean; }
export type OrderSource   = 'POS'|'ECOMMERCE'|'BACKOFFICE';
export type SaleOrderStatus = 'QUOTATION' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'READY_FOR_PICKUP' | 'DELIVERED' | 'CANCELLED';

export interface SaleOrder {
  id: string; branchId: string; source: OrderSource; status: SaleOrderStatus;
  customerId?: string; customerName?: string;
  customer?: { fullName?: string; phone?: string | null; email?: string | null };
  lines: OrderLineItem[];
  subtotal: number; cartDiscountTotal: number; grandTotal: number;
  afipInvoiceId?: string;
  paymentMethod: PaymentMethod; createdAt: string; syncedAt?: string;
}
export interface OrderLineItem {
  id: string; variantId: string; variantSku?: string; productName?: string;
  quantity: number; basePrice: number; discountAmount: number; finalPrice: number;
}

export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReturnAction = 'REFUND' | 'EXCHANGE' | 'STORE_CREDIT';
export type ItemCondition = 'SELLABLE' | 'DAMAGED' | 'DEFECTIVE';

export interface ReturnItem {
  id: string;
  orderLineId: string;
  variantId: string;
  variantSku?: string;
  quantity: number;
  condition: ItemCondition;
  reason: string;
  refundAmount: number;
}

export interface SaleReturn {
  id: string;
  saleOrderId: string;
  branchId: string;
  customerId?: string;
  customerName?: string;
  status: ReturnStatus;
  action: ReturnAction;
  items: ReturnItem[];
  totalRefundAmount: number;
  createdAt: string;
  resolvedAt?: string;
}

// ─── FULFILLMENT ─────────────────────────────────────────────────────────
export type OrderStatus = 'PENDING_PAYMENT'|'PAID'|'PICKING'|'PACKED'|'SHIPPED'|'DELIVERED'|'CANCELLED';
export interface OrderFulfillment {
  id: string; orderId: string; status: OrderStatus;
  trackingNumber?: string; courierName?: string; 
  shippedAt?: string; deliveredAt?: string;
}

// ─── RESERVATIONS ────────────────────────────────────────────────────────
export type ReservationStatus = 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'RELEASED';

export interface ReservationLine {
  id: string;
  variantId: string;
  variantSku?: string;
  quantity: number;
}

export interface StockReservation {
  id: string;
  branchId: string;
  customerId?: string;
  customerName?: string;
  status: ReservationStatus;
  lines: ReservationLine[];
  expiresAt: string;
  createdAt: string;
  notes?: string;
}

// ─── PRICING ─────────────────────────────────────────────────────────────
export interface PriceList {
  id: string;
  name: string;
  code: string;
  currency: string;
  type: 'BASE' | 'MODIFIER';
  modifierPercentage?: number;
  isActive: boolean;
  createdAt: string;
}

export interface PriceListItem {
  id: string;
  priceListId: string;
  variantId: string;
  overridePrice: number;
  variantSku?: string;
  variantName?: string;
  basePrice?: number;
}

export type PromotionType = 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT' | 'BOGO' | 'BULK_DISCOUNT' | 'CART_TOTAL_DISCOUNT' | 'CATEGORY_DISCOUNT';
export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  applicableTo: {
    type: 'ALL' | 'CATEGORY' | 'BRAND' | 'PRODUCT';
    ids?: string[];
  };
  conflictsWith?: string[]; // promotion IDs it conflicts with
  createdAt: string;
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────
export type CustomerType = 'INDIVIDUAL'|'BUSINESS';
export interface Customer {
  id: string; type: CustomerType; fullName: string;
  taxId?: string; email?: string; phone?: string;
  credit: { limit: number; used: number; available: number; onHold: boolean; };
  priceListId?: string;
  createdAt: string;
}

// ─── SUPPLIERS ───────────────────────────────────────────────────────────
export interface Supplier {
  id: string; companyName: string; contactName?: string;
  taxId?: string; email?: string;
  account: { balance: number; currency: string; };
  createdAt: string;
}

export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
export type NotificationDeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS' | 'APPROVE' | 'REJECT' | 'ISSUE' | 'CANCEL';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  module: string;
  entityType: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  createdAt: string;
}

export interface EntityTraceEntry {
  id: string;
  action: AuditAction;
  module: string;
  description: string;
  userName: string;
  createdAt: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
}

export type IntegrationStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING_CONFIG';
export type IntegrationProvider =
  | 'MERCADOPAGO'
  | 'MERCADOLIBRE'
  | 'AFIP'
  | 'WHATSAPP_TWILIO'
  | 'SENDGRID'
  | 'WOOCOMMERCE'
  | 'SHOPIFY'
  | 'GENERIC_WEBHOOK';

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  name: string;
  description: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
  config: Record<string, string>; // Key-value credential store (masked from backend)
  webhookUrl?: string;
  createdAt: string;
}

export interface WebhookLog {
  id: string;
  integrationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  event: string;
  statusCode?: number;
  responseTime?: number; // ms
  success: boolean;
  payload?: string; // JSON string, truncated
  errorMessage?: string;
  createdAt: string;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────
export type NotificationEvent =
  | 'SALE_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'PAYMENT_RECEIVED'
  | 'PURCHASE_ORDER_ISSUED'
  | 'GOODS_RECEIPT_RECEIVED'
  | 'LOW_STOCK_ALERT'
  | 'SHIFT_CLOSING_DISCREPANCY'
  | 'TRANSFER_DISPATCHED'
  | 'TRANSFER_RECEIVED'
  | 'INVOICE_ISSUED'
  | 'RETURN_APPROVED'
  | 'OVERDUE_CURRENT_ACCOUNT'
  | 'MANUAL_CURRENT_ACCOUNT_STATEMENT'
  | 'MANUAL_SALE_RECEIPT'
  | 'WELCOME_CUSTOMER'
  | 'OTP_CODE';

export interface NotificationTemplate {
  id: string;
  name: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  subject?: string;         // Email subject line
  body: string;             // May contain {{variables}}
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  templateId?: string;
  templateName?: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient: string;        // Email/Phone
  referenceId?: string;     // SaleOrder, PO, etc.
  status: NotificationDeliveryStatus;
  errorMessage?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

// ─── FINANCE ─────────────────────────────────────────────────────────────
export type AccountType = 'CASH'|'BANK'|'CREDIT_CARD'|'EXPENSE'|'REVENUE';
export interface FinancialAccount {
  id: string; name: string; type: AccountType;
  currency: string; balance: number; branchId?: string; isActive: boolean;
}

export type MovementDocumentType = 'INVOICE' | 'RECEIPT' | 'DEBIT_NOTE' | 'CREDIT_NOTE';
export type MovementStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';

export interface CurrentAccountMovement {
  id: string;
  accountId: string;
  date: string;
  documentType: MovementDocumentType;
  referenceId: string;
  description: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  dueDate?: string;
  status?: MovementStatus;
}

export interface CurrentAccount {
  id: string;
  entityId: string;
  entityName: string;
  entityType: 'CUSTOMER' | 'SUPPLIER';
  balance: number;
  currency: string;
  creditLimit?: number;
  overdueAmount: number;
  lastMovementDate?: string;
  phone?: string | null;
  email?: string | null;
}

export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface CashShift {
  id: string;
  accountId: string;
  accountName?: string;
  openedByUserId: string;
  openedByUserName?: string;
  closedByUserId?: string;
  status: ShiftStatus;
  openingBalance: number;
  expectedClosingBalance?: number;
  actualClosingBalance?: number;
  difference?: number;
  openedAt: string;
  closedAt?: string;
}

export interface TreasuryMovement {
  id: string;
  shiftId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  concept: string;
  createdAt: string;
  operatorName?: string;
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethodType = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'STORE_CREDIT' | 'MIXED';

export interface PaymentLine {
  method: PaymentMethodType;
  amount: number;
  reference?: string;
}

export interface PaymentRecord {
  id: string;
  referenceId: string; // SaleOrderId or InvoiceId
  amount: number;
  status: PaymentStatus;
  lines: PaymentLine[];
  customerName?: string;
  createdAt: string;
  completedAt?: string;
  gatewayUrl?: string; // For online redirects
}

export type InvoiceStatus = 'PENDING' | 'ISSUED' | 'FAILED' | 'CANCELLED';
export type InvoiceType = 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C' | 'NOTA_CREDITO_A' | 'NOTA_CREDITO_B';

export interface FiscalAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ElectronicInvoice {
  id: string;
  saleOrderId: string;
  type: InvoiceType;
  status: InvoiceStatus;
  // Fiscal data
  receiverName: string;
  receiverDocType: 'CUIT' | 'CUIL' | 'DNI';
  receiverDocNumber: string;
  receiverIvaCondition: string;
  receiverAddress?: FiscalAddress;
  // AFIP response
  cae?: string;
  caeDueDate?: string;
  afipCode?: string;
  afipMessage?: string;
  // Amounts
  subtotal: number;
  vatAmount: number;
  total: number;
  // Metadata
  issuedAt?: string;
  createdAt: string;
  pdfUrl?: string;
}

// ─── REPORTS ─────────────────────────────────────────────────────────────
export interface DashboardSummary {
  generatedAt: string;
  today:     { revenue: number; orders: number; avgOrderValue: number; cashInDrawers: number; };
  thisMonth: { revenue: number; orders: number; grossMarginPct: number; };
  topSellers: TopSellingVariant[];
  lowStockAlerts: LowStockAlert[];
  pendingOrders: number;
}
export interface TopSellingVariant {
  variantId: string; name: string; sku: string;
  totalUnitsSold: number; totalRevenue: number;
}
export interface LowStockAlert {
  variantId: string; sku: string; name: string;
  branchId: string; availableQuantity: number; reorderPoint: number;
}
export interface SalesSummaryReport {
  period: { from: string; to: string; };
  totalOrders: number; totalRevenue: number;
  totalDiscounts: number; netRevenue: number; averageOrderValue: number;
  byPaymentMethod: { method: string; count: number; amount: number }[];
  byChannel: Record<string, number>;
}

// ─── POS CART (local) ────────────────────────────────────────────────────
export interface CartLine {
  variantId: string; categoryId: string;
  sku: string; name: string; color?: string; size?: string;
  basePrice: number; quantity: number;
}

// ─── PAGINATION ──────────────────────────────────────────────────────────
export interface PagedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }
