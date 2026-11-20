export type ModuleId =
  | 'dashboard'
  | 'requisitions'
  | 'canvassing'
  | 'purchasing'
  | 'orders'
  | 'vouchers'
  | 'accounting'
  | 'tools'
  | 'docTracker'
  | 'reports'
  | 'masterData';

export type ProjectType = 'Road' | 'Bridge' | 'Building' | 'Administrative';

export type ItemGroup = 'Construction Materials' | 'ICT Equipment' | 'General Supplies';

export interface Project {
  id: string;
  code: string;
  name: string;
  type: ProjectType;
  location: string;
  budget: number;
  status: 'Active' | 'Completed' | 'On Hold';
  startDate: string;
  manager: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
  terms: string;
  category: string;
  rating: number;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  group: ItemGroup;
  category: string;
  unit: string;
  standardCost: number;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  signatureDataUrl?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  employeeId: string;
  roleLabel: string;
  isAdmin: boolean;
  allowedModules: ModuleId[];
}

export interface RequisitionItem {
  materialId: string;
  materialName: string;
  unit: string;
  qty: number;
  estUnitPrice: number;
}

export type RequisitionStatus = 'Draft' | 'For Canvassing' | 'Canvassed' | 'PR Generated' | 'Cancelled';

export interface Requisition {
  id: string;
  reqNo: string;
  projectId: string;
  department: string;
  category: ItemGroup;
  requestedBy: string;
  dateRequested: string;
  dateNeeded: string;
  purpose: string;
  status: RequisitionStatus;
  items: RequisitionItem[];
}

export interface CanvassQuote {
  id: string;
  supplierId: string;
  supplierName: string;
  materialId: string;
  unitPrice: number;
  leadTimeDays: number;
  remarks: string;
  isWinner?: boolean;
}

export type CanvassStatus = 'Open' | 'Awarded' | 'PR Created';

export interface Canvass {
  id: string;
  canvassNo: string;
  reqId: string;
  reqNo: string;
  projectId: string;
  category: ItemGroup;
  dateOpened: string;
  preparedBy: string;
  status: CanvassStatus;
  quotes: CanvassQuote[];
}

export interface PurchaseRequestItem {
  materialId: string;
  materialName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  supplierId: string;
  supplierName: string;
}

export type PRStatus =
  | 'Pending Note'
  | 'For Recommending Approval'
  | 'For Final Approval'
  | 'Approved'
  | 'Rejected'
  | 'PO Generated';

export interface SignatoryStamp {
  employeeId?: string;
  name: string;
  position: string;
  date: string;
}

export interface PurchaseRequest {
  id: string;
  prNo: string;
  canvassId: string;
  canvassNo: string;
  reqNo: string;
  projectId: string;
  department: string;
  dateCreated: string;
  status: PRStatus;
  totalAmount: number;
  canvassSavings: number;
  rejectionReason?: string;
  items: PurchaseRequestItem[];
  preparedBy: SignatoryStamp;
  notedBy?: SignatoryStamp;
  recommendingApprovalBy?: SignatoryStamp;
  approvedBy?: SignatoryStamp;
}

export type POStatus = 'Issued' | 'Partially Delivered' | 'Delivered' | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  poNo: string;
  prId: string;
  prNo: string;
  projectId: string;
  supplierId: string;
  supplierName: string;
  dateIssued: string;
  expectedDate: string;
  totalAmount: number;
  status: POStatus;
  items: PurchaseRequestItem[];
}

export interface ReceivingReport {
  id: string;
  rrNo: string;
  poId: string;
  poNo: string;
  projectId: string;
  supplierId: string;
  supplierName: string;
  invoiceNo: string;
  deliveryReceiptNo: string;
  dateReceived: string;
  receivedBy: string;
  receivedAmount: number;
  conditionNotes: string;
}

export type VoucherStatus = 'Pending Approval' | 'Approved' | 'Paid' | 'Cancelled';

export interface DisbursementVoucher {
  id: string;
  dvNo: string;
  poId: string;
  poNo: string;
  rrId: string;
  rrNo: string;
  projectId: string;
  supplierId: string;
  supplierName: string;
  department: string;
  invoiceNo: string;
  poAmount: number;
  rrAmount: number;
  invoiceAmount: number;
  threeWayMatched: boolean;
  dateCreated: string;
  dueDate: string;
  status: VoucherStatus;
  preparedBy: string;
  approvedBy?: string;
  dateApproved?: string;
  paidDate?: string;
  paymentMethod?: 'Check' | 'Bank Transfer' | 'Cash';
  paymentRef?: string;
  remarks: string;
}

export interface Account {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  normalBalance: 'Debit' | 'Credit';
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  jeNo: string;
  date: string;
  reference: string;
  projectId?: string;
  description: string;
  postedBy: string;
  lines: JournalLine[];
}

export type ToolStatus = 'Available' | 'Borrowed' | 'Under Repair' | 'Disposed' | 'Lost';

export interface ToolAsset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  brandModel: string;
  serialNo: string;
  purchaseDate: string;
  purchaseCost: number;
  projectId: string;
  condition: 'Good' | 'Minor Wear' | 'Damaged';
  status: ToolStatus;
}

export type BorrowStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Released' | 'Returned';

export interface BorrowRequest {
  id: string;
  trNo: string;
  toolId: string;
  toolAssetCode: string;
  toolName: string;
  borrowerEmployeeId: string;
  borrowerName: string;
  borrowerPosition: string;
  department: string;
  projectId: string;
  purpose: string;
  requestDate: string;
  expectedReturnDate: string;
  status: BorrowStatus;
  approvedBy?: string;
  approvedDate?: string;
  releasedBy?: string;
  releasedByEmployeeId?: string;
  releaseDate?: string;
  releaseCondition?: string;
  returnedDate?: string;
  returnCondition?: 'Good' | 'Minor Damage' | 'Major Damage' | 'Missing Parts';
  returnRemarks?: string;
  damagePhotoDataUrl?: string;
  receivedByCustodian?: string;
}

export interface ToolAuditLog {
  id: string;
  toolId: string;
  assetCode: string;
  toolName: string;
  action: string;
  actor: string;
  timestamp: string;
  remarks: string;
}

export interface ToolRepairRecord {
  id: string;
  toolId: string;
  assetCode: string;
  toolName: string;
  dateSent: string;
  technician: string;
  issueDescription: string;
  partsReplaced: string;
  repairCost: number;
  status: 'In Progress' | 'Completed';
  dateCompleted?: string;
}

export interface ToolDisposalRecord {
  id: string;
  toolId: string;
  assetCode: string;
  toolName: string;
  disposalDate: string;
  reason: string;
  method: 'Scrap' | 'Auction' | 'Write-Off' | 'Donation';
  salvageValue: number;
  approvedBy: string;
}

export interface ERPState {
  projects: Project[];
  suppliers: Supplier[];
  materials: Material[];
  employees: Employee[];
  users: UserAccount[];
  requisitions: Requisition[];
  canvasses: Canvass[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  receivingReports: ReceivingReport[];
  vouchers: DisbursementVoucher[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  tools: ToolAsset[];
  borrowRequests: BorrowRequest[];
  toolAuditLogs: ToolAuditLog[];
  repairRecords: ToolRepairRecord[];
  disposalRecords: ToolDisposalRecord[];
}

export type PrintDocument =
  | { kind: 'pr'; prId: string }
  | { kind: 'borrower-slip'; borrowId: string }
  | { kind: 'doc-slip'; docType: 'Requisition' | 'Canvass'; refId: string }
  | {
      kind: 'report';
      title: string;
      moduleName: string;
      periodLabel: string;
      filtersSummary: string;
      generatedBy: string;
      columns: string[];
      rows: (string | number)[][];
      summaryCards: { label: string; value: string }[];
    };
