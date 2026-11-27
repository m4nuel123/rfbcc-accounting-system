var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/vercelEntry.ts
var vercelEntry_exports = {};
__export(vercelEntry_exports, {
  default: () => vercelEntry_default
});
module.exports = __toCommonJS(vercelEntry_exports);
var import_express2 = __toESM(require("express"), 1);

// server/erpBackend.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_express = __toESM(require("express"), 1);

// src/utils/erpConfig.ts
var ALL_MODULES = [
  { id: "dashboard", label: "Dashboard (BI)" },
  { id: "projects", label: "Project Management" },
  { id: "requisitions", label: "Requisitions" },
  { id: "canvassing", label: "Canvassing" },
  { id: "purchasing", label: "Purchasing" },
  { id: "orders", label: "Orders & Receiving" },
  { id: "vouchers", label: "Vouchers (DV)" },
  { id: "accounting", label: "Accounting / GL" },
  { id: "tools", label: "Tools & Equipment" },
  { id: "docTracker", label: "Document Tracker" },
  { id: "reports", label: "Reports" },
  { id: "masterData", label: "Master Data" }
];
var ALL_PERMISSIONS = [
  { id: "view_dashboard", label: "View Dashboard", description: "View executive BI KPIs and analytics charts (Admin, Heads & VPs only)" },
  { id: "view_transactions", label: "View", description: "View operational records, projects, requisitions, vouchers, and ledgers" },
  { id: "create_transactions", label: "Create", description: "Create new projects, requisitions, quotes, POs, vouchers, JEs, and logs" },
  { id: "edit_transactions", label: "Edit", description: "Modify open canvasses, projects, drafts, receipts, and voucher info" },
  { id: "delete_transactions", label: "Delete / Cancel", description: "Cancel vouchers or delete master records" },
  { id: "submit_transactions", label: "Submit", description: "Submit requisitions, canvasses, and vouchers into workflow" },
  { id: "process_transactions", label: "Process", description: "Process supplier quotations, POs, receiving, and voucher disbursements" },
  { id: "approve_transactions", label: "Approve", description: "Sign Noted By, Recommending Approval, Final Approval, and DV Approval" },
  { id: "reject_transactions", label: "Reject", description: "Reject purchase requests, borrow requests, or pending workflows" },
  { id: "print_documents", label: "Print / PDF", description: "Print official PR forms, slips, and formatted PDF reports" },
  { id: "generate_reports", label: "Generate Reports", description: "Run financial, purchasing, canvassing, and tool reports" },
  { id: "export_reports", label: "Export PDF Reports", description: "Download formatted PDF reports and packages" },
  { id: "export_csv", label: "Export CSV (Mgmt)", description: "Export CSV report datasets (Admin, Department Heads & VPs only)" },
  { id: "manage_users", label: "Manage Users & RBAC", description: "Manage user accounts, passwords, companies, and permissions" },
  { id: "manage_companies", label: "Manage Companies", description: "Configure company entities, themes, and branding" }
];
var ALL_PERMISSION_IDS = ALL_PERMISSIONS.map((p) => p.id);
var ALL_MODULE_IDS = ALL_MODULES.map((m) => m.id);
var DEFAULT_COMPANIES = [
  {
    id: "comp-rfb",
    code: "RFB",
    name: "RFB Construction",
    legalName: "RFB CONSTRUCTION CORPORATION",
    tagline: "General Engineering, Roads, Bridges & Vertical Structures",
    address: "P-1 A Brgy. Doongan, Butuan City, Agusan Del Norte",
    tin: "009-482-119-000",
    email: "procurement@rfbconstruction.ph",
    logoUrl: "/assets/aistudio/rfb-logo.png",
    themePrimary: "#123E82",
    themeAccent: "#2C6FE0",
    isActive: true
  },
  {
    id: "comp-rbi",
    code: "RBI",
    name: "RBI Construction",
    legalName: "RODNET BUILDERS INCORPORATED",
    tagline: "Civil Works, Bridges, Infrastructure & Commercial Building \xB7 Est. 2020",
    address: "P-1 A Brgy. Doongan, Butuan City, Agusan Del Norte",
    tin: "010-774-821-000",
    email: "procurement@rodnetbuilders.ph",
    logoUrl: "/assets/aistudio/image_d9fd67be.png",
    themePrimary: "#113E2B",
    themeAccent: "#1B6B4A",
    isActive: true
  }
];
var ENG_MONITORING_MODULES = ["requisitions", "docTracker"];
var ENG_STAFF_MODULES = ["requisitions", "docTracker", "tools"];
var PURCHASING_HEAD_MODULES = ["dashboard", "projects", "requisitions", "canvassing", "purchasing", "orders", "docTracker", "reports"];
var PURCHASING_STAFF_MODULES = ["requisitions", "canvassing", "purchasing", "orders", "docTracker"];
var MOTORPOOL_PURCHASING_MODULES = ["requisitions", "canvassing", "purchasing", "orders", "tools", "docTracker"];
var ACCOUNTING_HEAD_MODULES = ["dashboard", "projects", "vouchers", "accounting", "docTracker", "reports"];
var ACCOUNTING_VOUCHER_MODULES = ["vouchers", "accounting", "docTracker"];
var FINANCE_VP_MODULES = [
  "dashboard",
  "projects",
  "requisitions",
  "canvassing",
  "purchasing",
  "orders",
  "vouchers",
  "accounting",
  "docTracker",
  "reports"
];
var ENG_MONITORING_PERMS = ["view_transactions", "create_transactions", "edit_transactions", "submit_transactions"];
var ENG_STAFF_PERMS = ["view_transactions", "create_transactions", "edit_transactions", "submit_transactions", "process_transactions", "print_documents"];
var PURCHASING_HEAD_PERMS = ["view_dashboard", "view_transactions", "create_transactions", "edit_transactions", "submit_transactions", "process_transactions", "approve_transactions", "reject_transactions", "print_documents", "generate_reports", "export_reports", "export_csv"];
var PURCHASING_STAFF_PERMS = ["view_transactions", "create_transactions", "edit_transactions", "submit_transactions", "process_transactions", "print_documents"];
var ACCOUNTING_HEAD_PERMS = ["view_dashboard", "view_transactions", "create_transactions", "edit_transactions", "submit_transactions", "process_transactions", "approve_transactions", "reject_transactions", "print_documents", "generate_reports", "export_reports", "export_csv"];
var ACCOUNTING_STAFF_PERMS = ["view_transactions", "create_transactions", "edit_transactions", "submit_transactions", "process_transactions", "print_documents"];
var FINANCE_VP_PERMS = ["view_dashboard", "view_transactions", "approve_transactions", "reject_transactions", "print_documents", "generate_reports", "export_reports", "export_csv"];
var INITIAL_ERP_STATE = {
  companies: DEFAULT_COMPANIES,
  projects: [
    // RFB Projects
    {
      id: "proj-1",
      companyId: "comp-rfb",
      code: "PRJ-BKD-01",
      name: "Bukidnon Provincial Road",
      type: "Road",
      location: "Malaybalay City, Bukidnon",
      clientOwner: "Provincial Government of Bukidnon",
      description: "Concrete & hot-mix asphalt rehabilitation covering 4.8 km provincial highway corridor with drainage canals.",
      manager: "Engr. Peter Villanueva",
      startDate: "2026-02-01",
      targetCompletionDate: "2026-10-15",
      budget: 185e5,
      status: "Ongoing",
      progress: 68,
      remarks: "Sub-base compaction completed; Item 310 asphalt overlay ongoing (subject to quarry weather window)."
    },
    {
      id: "proj-2",
      companyId: "comp-rfb",
      code: "PRJ-BKD-02",
      name: "Pulangi River Bridge",
      type: "Bridge",
      location: "Valencia City, Bukidnon",
      clientOwner: "DPWH Region X",
      description: "Two-span reinforced concrete girder bridge with bored pile foundation and approach embankment protection.",
      manager: "Engr. Peter Villanueva",
      startDate: "2026-03-10",
      targetCompletionDate: "2027-04-30",
      budget: 24e6,
      status: "Ongoing",
      progress: 52,
      remarks: "Abutment & central pier reinforcement pouring on schedule."
    },
    {
      id: "proj-3",
      companyId: "comp-rfb",
      code: "PRJ-BKD-03",
      name: "Bukidnon Civic & Commercial Building",
      type: "Building",
      location: "Manolo Fortich, Bukidnon",
      clientOwner: "Manolo Fortich Municipal LGU",
      description: "Three-storey municipal civic & commercial complex with structural steel roof framing and MEPF fit-out.",
      manager: "Juan Dela Cruz",
      startDate: "2026-04-15",
      targetCompletionDate: "2027-02-28",
      budget: 142e5,
      status: "On Hold",
      progress: 35,
      remarks: "Awaiting revised LGU electrical load permit prior to 3rd-floor slab pour."
    },
    {
      id: "proj-4",
      companyId: "comp-rfb",
      code: "PRJ-HO-00",
      name: "RFB Head Office / Administrative",
      type: "Administrative",
      location: "P-1 A Brgy. Doongan, Butuan City, Agusan Del Norte",
      clientOwner: "RFB Construction Corporation",
      description: "Headquarters IT infrastructure upgrade, engineering CAD workstations, and administrative operations fit-out.",
      manager: "Roberto Aquino",
      startDate: "2026-01-05",
      targetCompletionDate: "2026-08-30",
      actualCompletionDate: "2026-08-22",
      budget: 35e5,
      status: "Completed",
      progress: 100,
      remarks: "Completed ahead of schedule and turned over to Central Admin."
    },
    // RBI Projects
    {
      id: "proj-rbi-1",
      companyId: "comp-rbi",
      code: "RBI-AGN-01",
      name: "Agusan River Floodway & Slope Protection",
      type: "Road",
      location: "Butuan City, Agusan Del Norte",
      clientOwner: "DPWH Caraga Region XIII",
      description: "Sheet steel pile retaining wall and Class A boulder riprap floodway protection along Agusan River bank.",
      manager: "Engr. Camille Bautista",
      startDate: "2026-01-18",
      targetCompletionDate: "2026-10-30",
      budget: 215e5,
      status: "Ongoing",
      progress: 74,
      remarks: "Sheet pile driving 85% complete; boulder riprap armor placement underway."
    },
    {
      id: "proj-rbi-2",
      companyId: "comp-rbi",
      code: "RBI-AGN-02",
      name: "Cabadbaran Concrete Span Bridge Rehab",
      type: "Bridge",
      location: "Cabadbaran City, Agusan Del Norte",
      clientOwner: "City Government of Cabadbaran",
      description: "Structural deck slab replacement, girder retrofitting, and marine-grade concrete scour protection.",
      manager: "Engr. Rodnet Velasco",
      startDate: "2026-02-22",
      targetCompletionDate: "2027-05-15",
      budget: 268e5,
      status: "Ongoing",
      progress: 48,
      remarks: "Marine-grade concrete batching and 25mm girder rebar fabrication active."
    },
    {
      id: "proj-rbi-3",
      companyId: "comp-rbi",
      code: "RBI-CRG-03",
      name: "Caraga Trade & Warehouse Complex",
      type: "Building",
      location: "Ampayon, Butuan City",
      clientOwner: "Caraga Logistics Consortium",
      description: "Pre-engineered steel warehouse bays with loading docks, office mezzanine, and perimeter drainage.",
      manager: "Engr. Camille Bautista",
      startDate: "2026-12-01",
      targetCompletionDate: "2027-08-30",
      budget: 156e5,
      status: "Planning",
      progress: 12,
      remarks: "Initial roofing and pozzolan cement canvassing opened; site mobilization next month."
    },
    {
      id: "proj-rbi-4",
      companyId: "comp-rbi",
      code: "RBI-HO-00",
      name: "RBI Central Yard & Head Office",
      type: "Administrative",
      location: "P-1 A Brgy. Doongan, Butuan City, Agusan Del Norte",
      clientOwner: "Rodnet Builders Incorporated",
      description: "Motorpool yard expansion, survey instrument hub, and RBI administrative office annex.",
      manager: "Engr. Rodnet Velasco",
      startDate: "2026-12-15",
      targetCompletionDate: "2027-06-30",
      budget: 42e5,
      status: "Not Yet Started",
      progress: 0,
      remarks: "Scheduled for Q1 groundbreaking upon yard perimeter clearing."
    }
  ],
  suppliers: [
    // RFB Suppliers
    {
      id: "sup-1",
      companyId: "comp-rfb",
      name: "Bukidnon Aggregates & Ready-Mix Corp.",
      contact: "0917-552-4410",
      address: "Sayre Hwy, Valencia City, Bukidnon",
      terms: "Net 30",
      category: "Aggregates & Concrete",
      rating: 4.8
    },
    {
      id: "sup-2",
      companyId: "comp-rfb",
      name: "Mindanao Steel & Rebar Trading",
      contact: "0918-773-1922",
      address: "Cagayan de Oro / Bukidnon Hub",
      terms: "Net 30",
      category: "Structural Steel",
      rating: 4.7
    },
    {
      id: "sup-3",
      companyId: "comp-rfb",
      name: "Malaybalay Builders Supply Co.",
      contact: "0927-810-3304",
      address: "Fortich St., Malaybalay City, Bukidnon",
      terms: "Net 15",
      category: "General Hardware & Cement",
      rating: 4.6
    },
    {
      id: "sup-4",
      companyId: "comp-rfb",
      name: "Highland Asphalt & Bitumen Inc.",
      contact: "0917-904-2811",
      address: "Maramag, Bukidnon",
      terms: "Net 45",
      category: "Road Paving Materials",
      rating: 4.5
    },
    {
      id: "sup-5",
      companyId: "comp-rfb",
      name: "Northern Mindanao ICT Solutions",
      contact: "0917-340-8819",
      address: "Valencia City, Bukidnon",
      terms: "COD / Net 15",
      category: "ICT Equipment",
      rating: 4.9
    },
    {
      id: "sup-6",
      companyId: "comp-rfb",
      name: "Bukidnon Office & Paper Mart",
      contact: "0928-615-7740",
      address: "Malaybalay City, Bukidnon",
      terms: "Net 15",
      category: "General Supplies",
      rating: 4.4
    },
    // RBI Suppliers
    {
      id: "sup-rbi-1",
      companyId: "comp-rbi",
      name: "Caraga Quarry & Aggregates Inc.",
      contact: "0917-612-8830",
      address: "Libertad, Butuan City, Agusan Del Norte",
      terms: "Net 30",
      category: "Aggregates & Concrete",
      rating: 4.8
    },
    {
      id: "sup-rbi-2",
      companyId: "comp-rbi",
      name: "Butuan Structural Steel Depot",
      contact: "0918-449-2011",
      address: "National Hwy, Baan, Butuan City",
      terms: "Net 30",
      category: "Structural Steel",
      rating: 4.9
    },
    {
      id: "sup-rbi-3",
      companyId: "comp-rbi",
      name: "Agusan Ready-Mix & Cement Corp.",
      contact: "0920-774-5102",
      address: "Cabadbaran City, Agusan Del Norte",
      terms: "Net 15",
      category: "Ready-Mix & Cement",
      rating: 4.7
    },
    {
      id: "sup-rbi-4",
      companyId: "comp-rbi",
      name: "Mindanao Civil Paving & Emulsions",
      contact: "0917-809-1455",
      address: "Nasipit Port Industrial Zone",
      terms: "Net 45",
      category: "Road Paving Materials",
      rating: 4.6
    },
    {
      id: "sup-rbi-5",
      companyId: "comp-rbi",
      name: "Caraga Tech & Survey Supplies",
      contact: "0927-331-9040",
      address: "Montilla Blvd., Butuan City",
      terms: "Net 15",
      category: "ICT & Survey Instruments",
      rating: 4.8
    }
  ],
  materials: [
    // RFB Materials
    { id: "mat-1", companyId: "comp-rfb", code: "MAT-C01", name: "Portland Cement Type I (40kg)", group: "Construction Materials", category: "Road & Structural", unit: "Bag", standardCost: 265 },
    { id: "mat-2", companyId: "comp-rfb", code: "MAT-C02", name: "Deformed Rebar 16mm x 6m (Grade 60)", group: "Construction Materials", category: "Bridge & Structural", unit: "Length", standardCost: 485 },
    { id: "mat-3", companyId: "comp-rfb", code: "MAT-C03", name: "Deformed Rebar 20mm x 6m (Grade 60)", group: "Construction Materials", category: "Bridge & Structural", unit: "Length", standardCost: 745 },
    { id: "mat-4", companyId: "comp-rfb", code: "MAT-C04", name: 'Crushed Gravel G1 (3/4")', group: "Construction Materials", category: "Road Materials", unit: "cu.m.", standardCost: 1350 },
    { id: "mat-5", companyId: "comp-rfb", code: "MAT-C05", name: "Washed River Sand", group: "Construction Materials", category: "Aggregates", unit: "cu.m.", standardCost: 1150 },
    { id: "mat-6", companyId: "comp-rfb", code: "MAT-C06", name: "Hot-Mix Asphalt Concrete (Item 310)", group: "Construction Materials", category: "Road Materials", unit: "Metric Ton", standardCost: 5800 },
    { id: "mat-7", companyId: "comp-rfb", code: "MAT-C07", name: "Ready-Mix Concrete 4000 PSI", group: "Construction Materials", category: "Bridge & Structural", unit: "cu.m.", standardCost: 5400 },
    { id: "mat-8", companyId: "comp-rfb", code: "MAT-C08", name: 'CHB 6" Load-Bearing Concrete Hollow Block', group: "Construction Materials", category: "Building Supplies", unit: "Piece", standardCost: 24 },
    { id: "mat-9", companyId: "comp-rfb", code: "MAT-C09", name: 'Marine Plywood 3/4" x 4x8', group: "Construction Materials", category: "Building Supplies", unit: "Sheet", standardCost: 1280 },
    { id: "mat-10", companyId: "comp-rfb", code: "MAT-I01", name: "Engineering Workstation Laptop (i7 / 32GB)", group: "ICT Equipment", category: "Computing", unit: "Unit", standardCost: 68500 },
    { id: "mat-11", companyId: "comp-rfb", code: "MAT-I02", name: "All-in-One Tank Inkjet Plotter/Printer A3", group: "ICT Equipment", category: "Peripherals", unit: "Unit", standardCost: 24500 },
    { id: "mat-12", companyId: "comp-rfb", code: "MAT-I03", name: "Enterprise Dual-WAN Site Router", group: "ICT Equipment", category: "Networking", unit: "Unit", standardCost: 11200 },
    { id: "mat-13", companyId: "comp-rfb", code: "MAT-I04", name: "CAD / BIM Annual Seat License", group: "ICT Equipment", category: "Software", unit: "License", standardCost: 18500 },
    { id: "mat-14", companyId: "comp-rfb", code: "MAT-G01", name: "A4 Bond Paper 80gsm (500 Sheets)", group: "General Supplies", category: "Office Stationery", unit: "Ream", standardCost: 245 },
    { id: "mat-15", companyId: "comp-rfb", code: "MAT-G02", name: "Printer Pigment Ink Bottle Set (CMYK)", group: "General Supplies", category: "Consumables", unit: "Set", standardCost: 1650 },
    { id: "mat-16", companyId: "comp-rfb", code: "MAT-G03", name: "Heavy-Duty Arch Lever Folders", group: "General Supplies", category: "Filing", unit: "Box (12s)", standardCost: 1440 },
    { id: "mat-17", companyId: "comp-rfb", code: "MAT-G04", name: "Site Safety Vest & Hard Hat Kit", group: "General Supplies", category: "Safety & PPE", unit: "Set", standardCost: 650 },
    // RBI Materials
    { id: "mat-rbi-1", companyId: "comp-rbi", code: "RBI-C01", name: "Pozzolan Cement Type IP (40kg)", group: "Construction Materials", category: "Road & Structural", unit: "Bag", standardCost: 258 },
    { id: "mat-rbi-2", companyId: "comp-rbi", code: "RBI-C02", name: "Sheet Steel Pile Grade SY390 (12m)", group: "Construction Materials", category: "Bridge & Structural", unit: "Length", standardCost: 18400 },
    { id: "mat-rbi-3", companyId: "comp-rbi", code: "RBI-C03", name: "Deformed Rebar 25mm x 9m (Grade 60)", group: "Construction Materials", category: "Bridge & Structural", unit: "Length", standardCost: 1290 },
    { id: "mat-rbi-4", companyId: "comp-rbi", code: "RBI-C04", name: "Boulder Riprap Stone (Class A)", group: "Construction Materials", category: "Road Materials", unit: "cu.m.", standardCost: 1480 },
    { id: "mat-rbi-5", companyId: "comp-rbi", code: "RBI-C05", name: "Ready-Mix Concrete 4500 PSI Marine Grade", group: "Construction Materials", category: "Bridge & Structural", unit: "cu.m.", standardCost: 5950 },
    { id: "mat-rbi-6", companyId: "comp-rbi", code: "RBI-C06", name: "Pre-Painted Rib-Type Roofing 0.5mm", group: "Construction Materials", category: "Building Supplies", unit: "Linear m", standardCost: 420 },
    { id: "mat-rbi-7", companyId: "comp-rbi", code: "RBI-I01", name: "RTK GNSS Field Rover Kit", group: "ICT Equipment", category: "Surveying", unit: "Unit", standardCost: 145e3 },
    { id: "mat-rbi-8", companyId: "comp-rbi", code: "RBI-G01", name: "Heavy-Duty Safety Harness & Helmet Pack", group: "General Supplies", category: "Safety & PPE", unit: "Set", standardCost: 1850 }
  ],
  employees: [
    // System Administrators & Group Cross-Company Personnel (RFB primary directory + RBI signatory compatibility)
    { id: "emp-michael", companyId: "comp-rfb", name: "Michael Bustillo", position: "System Administrator", department: "IT & Systems Administration", email: "michael.bustillo@rfbconstruction.ph" },
    { id: "emp-roger", companyId: "comp-rfb", name: "Roger Bustillo", position: "System Administrator", department: "IT & Systems Administration", email: "roger.bustillo@rfbconstruction.ph" },
    { id: "emp-rolando", companyId: "comp-rfb", name: "Rolando Manuel", position: "System Administrator", department: "IT & Systems Administration", email: "rolando.manuel@rfbconstruction.ph" },
    { id: "emp-eng-mon", companyId: "comp-rfb", name: "Engineering Monitoring", position: "Engineering Monitoring", department: "Engineering", email: "eng.monitoring@rfbconstruction.ph" },
    { id: "emp-jovan", companyId: "comp-rfb", name: "Jovan", position: "Engineering Staff", department: "Engineering", email: "jovan@rfbconstruction.ph" },
    { id: "emp-maggie", companyId: "comp-rfb", name: "Maggie Magdalena Cales", position: "Purchasing / Canvassing Head", department: "Purchasing / Canvassing", email: "maggie.cales@rfbconstruction.ph" },
    { id: "emp-elen", companyId: "comp-rfb", name: "Elen Beth Panoncia", position: "Purchasing / Canvassing Staff", department: "Purchasing / Canvassing", email: "elen.panoncia@rfbconstruction.ph" },
    { id: "emp-merrygrace", companyId: "comp-rfb", name: "Merry Grace Boca", position: "Purchasing / Canvassing Staff \u2013 Motorpool", department: "Motorpool / Purchasing", email: "merrygrace.boca@rfbconstruction.ph" },
    { id: "emp-marvin", companyId: "comp-rfb", name: "Marvin Tortor", position: "Accounting Head", department: "Accounting", email: "marvin.tortor@rfbconstruction.ph" },
    { id: "emp-sherlyn", companyId: "comp-rfb", name: "Sherlyn Capa", position: "Accounting Voucher Staff", department: "Accounting", email: "sherlyn.capa@rfbconstruction.ph" },
    { id: "emp-mariaeva", companyId: "comp-rfb", name: "Maria Eva Bustillo", position: "Finance Vice President", department: "Finance & Executive", email: "mariaeva.bustillo@rfbconstruction.ph" },
    // Historical RFB Signatories preserved for existing PRs/Vouchers/Projects
    { id: "emp-juan", companyId: "comp-rfb", name: "Juan Dela Cruz", position: "Site Engineer", department: "Field Operations", email: "juan@rfbconstruction.ph" },
    { id: "emp-maria", companyId: "comp-rfb", name: "Maria Santos", position: "Purchasing Officer", department: "Purchasing / Canvassing", email: "maria@rfbconstruction.ph" },
    { id: "emp-peter", companyId: "comp-rfb", name: "Engr. Peter Villanueva", position: "Project Engineer", department: "Engineering", email: "peter@rfbconstruction.ph" },
    { id: "emp-roberto", companyId: "comp-rfb", name: "Roberto Aquino", position: "General Manager", department: "Finance & Executive", email: "roberto@rfbconstruction.ph" },
    { id: "emp-ramil", companyId: "comp-rfb", name: "Ramil Torres", position: "Warehouse Custodian", department: "Warehouse & Logistics", email: "ramil@rfbconstruction.ph" },
    // RBI Employees
    { id: "emp-rbi-leivlyn", companyId: "comp-rbi", name: "Leivlyn Sabrido", position: "Purchasing / Canvassing Staff", department: "Purchasing / Canvassing", email: "leivlyn.sabrido@rodnetbuilders.ph" },
    { id: "emp-rbi-lovely", companyId: "comp-rbi", name: "Lovely Navales", position: "Accounting Voucher Staff", department: "Accounting", email: "lovely.navales@rodnetbuilders.ph" },
    { id: "emp-rbi-aprilrose", companyId: "comp-rbi", name: "April Rose Bustillo", position: "Accounting Voucher Staff", department: "Accounting", email: "aprilrose.bustillo@rodnetbuilders.ph" },
    // Historical RBI Signatories preserved for existing PRs/Vouchers/Projects
    { id: "emp-rbi-rodnet", companyId: "comp-rbi", name: "Engr. Rodnet Velasco", position: "President / Final Approver", department: "Finance & Executive", email: "rodnet@rodnetbuilders.ph" },
    { id: "emp-rbi-camille", companyId: "comp-rbi", name: "Engr. Camille Bautista", position: "Senior Project Engineer", department: "Engineering", email: "camille@rodnetbuilders.ph" },
    { id: "emp-rbi-dennis", companyId: "comp-rbi", name: "Dennis Ocampo", position: "Property & Warehouse Head", department: "Warehouse & Logistics", email: "dennis@rodnetbuilders.ph" }
  ],
  users: [
    // E. System Administrators (RFB + RBI)
    {
      id: "usr-michael",
      username: "michael",
      password: "michael",
      employeeCode: "EMP-SYS-001",
      fullName: "Michael Bustillo",
      department: "IT & Systems Administration",
      position: "System Administrator",
      employeeId: "emp-michael",
      roleLabel: "System Administrator",
      isAdmin: true,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: ALL_MODULE_IDS,
      companyAccess: [
        { companyId: "comp-rfb", roleLabel: "System Administrator", allowedModules: ALL_MODULE_IDS, permissions: ALL_PERMISSION_IDS },
        { companyId: "comp-rbi", roleLabel: "System Administrator", allowedModules: ALL_MODULE_IDS, permissions: ALL_PERMISSION_IDS }
      ]
    },
    {
      id: "usr-roger",
      username: "roger",
      password: "roger",
      employeeCode: "EMP-SYS-002",
      fullName: "Roger Bustillo",
      department: "IT & Systems Administration",
      position: "System Administrator",
      employeeId: "emp-roger",
      roleLabel: "System Administrator",
      isAdmin: true,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: ALL_MODULE_IDS,
      companyAccess: [
        { companyId: "comp-rfb", roleLabel: "System Administrator", allowedModules: ALL_MODULE_IDS, permissions: ALL_PERMISSION_IDS },
        { companyId: "comp-rbi", roleLabel: "System Administrator", allowedModules: ALL_MODULE_IDS, permissions: ALL_PERMISSION_IDS }
      ]
    },
    {
      id: "usr-rolando",
      username: "rolando",
      password: "rolando",
      employeeCode: "EMP-SYS-003",
      fullName: "Rolando Manuel",
      department: "IT & Systems Administration",
      position: "System Administrator",
      employeeId: "emp-rolando",
      roleLabel: "System Administrator",
      isAdmin: true,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: ALL_MODULE_IDS,
      companyAccess: [
        { companyId: "comp-rfb", roleLabel: "System Administrator", allowedModules: ALL_MODULE_IDS, permissions: ALL_PERMISSION_IDS },
        { companyId: "comp-rbi", roleLabel: "System Administrator", allowedModules: ALL_MODULE_IDS, permissions: ALL_PERMISSION_IDS }
      ]
    },
    // A. Engineering Department (RFB + RBI)
    {
      id: "usr-eng-monitoring",
      username: "engmonitoring",
      password: "engmonitoring",
      employeeCode: "EMP-ENG-001",
      fullName: "Engineering Monitoring",
      department: "Engineering",
      position: "Engineering Monitoring",
      employeeId: "emp-eng-mon",
      roleLabel: "Engineering Monitoring",
      isAdmin: false,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: ENG_MONITORING_MODULES,
      companyAccess: [
        { companyId: "comp-rfb", roleLabel: "Engineering Monitoring", allowedModules: ENG_MONITORING_MODULES, permissions: ENG_MONITORING_PERMS },
        { companyId: "comp-rbi", roleLabel: "Engineering Monitoring", allowedModules: ENG_MONITORING_MODULES, permissions: ENG_MONITORING_PERMS }
      ]
    },
    {
      id: "usr-jovan",
      username: "jovan",
      password: "jovan",
      employeeCode: "EMP-ENG-002",
      fullName: "Jovan",
      department: "Engineering",
      position: "Engineering Staff",
      employeeId: "emp-jovan",
      roleLabel: "Engineering Staff",
      isAdmin: false,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: ENG_STAFF_MODULES,
      companyAccess: [
        { companyId: "comp-rfb", roleLabel: "Engineering Staff", allowedModules: ENG_STAFF_MODULES, permissions: ENG_STAFF_PERMS },
        { companyId: "comp-rbi", roleLabel: "Engineering Staff", allowedModules: ENG_STAFF_MODULES, permissions: ENG_STAFF_PERMS }
      ]
    },
    // B. Purchasing / Canvassing Department
    {
      id: "usr-maggie",
      username: "maggie",
      password: "maggie",
      employeeCode: "EMP-PUR-001",
      fullName: "Maggie Magdalena Cales",
      department: "Purchasing / Canvassing",
      position: "Purchasing / Canvassing Head",
      employeeId: "emp-maggie",
      roleLabel: "Purchasing / Canvassing Head",
      isAdmin: false,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: PURCHASING_HEAD_MODULES,
      companyAccess: [
        { companyId: "comp-rfb", roleLabel: "Purchasing / Canvassing Head", allowedModules: PURCHASING_HEAD_MODULES, permissions: PURCHASING_HEAD_PERMS },
        { companyId: "comp-rbi", roleLabel: "Purchasing / Canvassing Head", allowedModules: PURCHASING_HEAD_MODULES, permissions: PURCHASING_HEAD_PERMS }
      ]
    },
    {
      id: "usr-rfbelen",
      username: "rfbelen",
      password: "rfbelen",
      employeeCode: "EMP-RFB-002",
      fullName: "Elen Beth Panoncia",
      department: "Purchasing / Canvassing",
      position: "Purchasing / Canvassing Staff",
      employeeId: "emp-elen",
      roleLabel: "Purchasing / Canvassing Staff",
      isAdmin: false,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: PURCHASING_STAFF_MODULES,
      companyAccess: [
        { companyId: "comp-rfb", roleLabel: "Purchasing / Canvassing Staff", allowedModules: PURCHASING_STAFF_MODULES, permissions: PURCHASING_STAFF_PERMS }
      ]
    },
    {
      id: "usr-rbileivlyn",
      username: "rbileivlyn",
      password: "rbileivlyn",
      employeeCode: "EMP-RBI-001",
      fullName: "Leivlyn Sabrido",
      department: "Purchasing / Canvassing",
      position: "Purchasing / Canvassing Staff",
      employeeId: "emp-rbi-leivlyn",
      roleLabel: "Purchasing / Canvassing Staff",
      isAdmin: false,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: PURCHASING_STAFF_MODULES,
      companyAccess: [
        { companyId: "comp-rbi", roleLabel: "Purchasing / Canvassing Staff", allowedModules: PURCHASING_STAFF_MODULES, permissions: PURCHASING_STAFF_PERMS }
      ]
    },
    {
      id: "usr-rfbmerrygrace",
      username: "rfbmerrygrace",
      password: "rfbmerrygrace",
      employeeCode: "EMP-RFB-003",
      fullName: "Merry Grace Boca",
      department: "Motorpool / Purchasing",
      position: "Purchasing / Canvassing Staff \u2013 Motorpool",
      employeeId: "emp-merrygrace",
      roleLabel: "Purchasing / Canvassing Staff \u2013 Motorpool",
      isAdmin: false,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: MOTORPOOL_PURCHASING_MODULES,
      companyAccess: [
        { companyId: "comp-rfb", roleLabel: "Purchasing / Canvassing Staff \u2013 Motorpool", allowedModules: MOTORPOOL_PURCHASING_MODULES, permissions: PURCHASING_STAFF_PERMS }
      ]
    },
    // C. Accounting Department
    {
      id: "usr-marvin",
      username: "marvin",
      password: "marvin",
      employeeCode: "EMP-ACC-001",
      fullName: "Marvin Tortor",
      department: "Accounting",
      position: "Accounting Head",
      employeeId: "emp-marvin",
      roleLabel: "Accounting Head",
      isAdmin: false,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: ACCOUNTING_HEAD_MODULES,
      companyAccess: [
        { companyId: "comp-rfb", roleLabel: "Accounting Head", allowedModules: ACCOUNTING_HEAD_MODULES, permissions: ACCOUNTING_HEAD_PERMS },
        { companyId: "comp-rbi", roleLabel: "Accounting Head", allowedModules: ACCOUNTING_HEAD_MODULES, permissions: ACCOUNTING_HEAD_PERMS }
      ]
    },
    {
      id: "usr-rbilovely",
      username: "rbilovely",
      password: "rbilovely",
      employeeCode: "EMP-RBI-002",
      fullName: "Lovely Navales",
      department: "Accounting",
      position: "Accounting Voucher Staff",
      employeeId: "emp-rbi-lovely",
      roleLabel: "Accounting Voucher Staff",
      isAdmin: false,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: ACCOUNTING_VOUCHER_MODULES,
      companyAccess: [
        { companyId: "comp-rbi", roleLabel: "Accounting Voucher Staff", allowedModules: ACCOUNTING_VOUCHER_MODULES, permissions: ACCOUNTING_STAFF_PERMS }
      ]
    },
    {
      id: "usr-rbiaprilrose",
      username: "rbiaprilrose",
      password: "rbiaprilrose",
      employeeCode: "EMP-RBI-003",
      fullName: "April Rose Bustillo",
      department: "Accounting",
      position: "Accounting Voucher Staff",
      employeeId: "emp-rbi-aprilrose",
      roleLabel: "Accounting Voucher Staff",
      isAdmin: false,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: ACCOUNTING_VOUCHER_MODULES,
      companyAccess: [
        { companyId: "comp-rbi", roleLabel: "Accounting Voucher Staff", allowedModules: ACCOUNTING_VOUCHER_MODULES, permissions: ACCOUNTING_STAFF_PERMS }
      ]
    },
    {
      id: "usr-rfbsherlyn",
      username: "rfbsherlyn",
      password: "rfbsherlyn",
      employeeCode: "EMP-RFB-004",
      fullName: "Sherlyn Capa",
      department: "Accounting",
      position: "Accounting Voucher Staff",
      employeeId: "emp-sherlyn",
      roleLabel: "Accounting Voucher Staff",
      isAdmin: false,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: ACCOUNTING_VOUCHER_MODULES,
      companyAccess: [
        { companyId: "comp-rfb", roleLabel: "Accounting Voucher Staff", allowedModules: ACCOUNTING_VOUCHER_MODULES, permissions: ACCOUNTING_STAFF_PERMS }
      ]
    },
    // D. Finance VP (RFB + RBI)
    {
      id: "usr-mariaeva",
      username: "mariaeva",
      password: "mariaeva",
      employeeCode: "EMP-FIN-001",
      fullName: "Maria Eva Bustillo",
      department: "Finance & Executive",
      position: "Finance Vice President",
      employeeId: "emp-mariaeva",
      roleLabel: "Finance Vice President",
      isAdmin: false,
      accountStatus: "Active",
      employmentStatus: "Regular",
      mustChangePassword: true,
      dateCreated: "2026-11-23",
      createdBy: "System Setup",
      updatedBy: "System Setup",
      allowedModules: FINANCE_VP_MODULES,
      companyAccess: [
        { companyId: "comp-rfb", roleLabel: "Finance Vice President", allowedModules: FINANCE_VP_MODULES, permissions: FINANCE_VP_PERMS },
        { companyId: "comp-rbi", roleLabel: "Finance Vice President", allowedModules: FINANCE_VP_MODULES, permissions: FINANCE_VP_PERMS }
      ]
    }
  ],
  requisitions: [
    // RFB Requisitions
    {
      id: "req-1",
      companyId: "comp-rfb",
      reqNo: "REQ-2026-0001",
      projectId: "proj-1",
      department: "Field Operations",
      category: "Construction Materials",
      requestedBy: "Juan Dela Cruz",
      dateRequested: "2026-10-02",
      dateNeeded: "2026-10-10",
      purpose: "Sub-base & asphalt paving batch 1 for Bukidnon Provincial Road km 12-15",
      status: "PR Generated",
      items: [
        { materialId: "mat-6", materialName: "Hot-Mix Asphalt Concrete (Item 310)", unit: "Metric Ton", qty: 180, estUnitPrice: 5800 },
        { materialId: "mat-4", materialName: 'Crushed Gravel G1 (3/4")', unit: "cu.m.", qty: 240, estUnitPrice: 1350 }
      ]
    },
    {
      id: "req-2",
      companyId: "comp-rfb",
      reqNo: "REQ-2026-0002",
      projectId: "proj-2",
      department: "Engineering",
      category: "Construction Materials",
      requestedBy: "Engr. Peter Villanueva",
      dateRequested: "2026-10-14",
      dateNeeded: "2026-10-22",
      purpose: "Abutment & pier reinforcement steel and concrete pour for Pulangi River Bridge",
      status: "PR Generated",
      items: [
        { materialId: "mat-3", materialName: "Deformed Rebar 20mm x 6m (Grade 60)", unit: "Length", qty: 420, estUnitPrice: 745 },
        { materialId: "mat-7", materialName: "Ready-Mix Concrete 4000 PSI", unit: "cu.m.", qty: 140, estUnitPrice: 5400 }
      ]
    },
    {
      id: "req-3",
      companyId: "comp-rfb",
      reqNo: "REQ-2026-0003",
      projectId: "proj-3",
      department: "Field Operations",
      category: "Construction Materials",
      requestedBy: "Juan Dela Cruz",
      dateRequested: "2026-11-04",
      dateNeeded: "2026-11-18",
      purpose: "2nd floor masonry walling and cement batch for Bukidnon Civic Building",
      status: "Canvassed",
      items: [
        { materialId: "mat-1", materialName: "Portland Cement Type I (40kg)", unit: "Bag", qty: 650, estUnitPrice: 265 },
        { materialId: "mat-8", materialName: 'CHB 6" Load-Bearing Concrete Hollow Block', unit: "Piece", qty: 4500, estUnitPrice: 24 }
      ]
    },
    {
      id: "req-4",
      companyId: "comp-rfb",
      reqNo: "REQ-2026-0004",
      projectId: "proj-4",
      department: "IT & Management",
      category: "ICT Equipment",
      requestedBy: "Maria Santos",
      dateRequested: "2026-11-12",
      dateNeeded: "2026-11-26",
      purpose: "New CAD workstation laptops and A3 engineering plotter for Butuan Head Office",
      status: "For Canvassing",
      items: [
        { materialId: "mat-10", materialName: "Engineering Workstation Laptop (i7 / 32GB)", unit: "Unit", qty: 3, estUnitPrice: 68500 },
        { materialId: "mat-11", materialName: "All-in-One Tank Inkjet Plotter/Printer A3", unit: "Unit", qty: 1, estUnitPrice: 24500 }
      ]
    },
    {
      id: "req-5",
      companyId: "comp-rfb",
      reqNo: "REQ-2026-0005",
      projectId: "proj-4",
      department: "Accounting",
      category: "General Supplies",
      requestedBy: "Ana Reyes",
      dateRequested: "2026-11-16",
      dateNeeded: "2026-11-25",
      purpose: "Monthly office bond paper, pigment inks, and voucher filing folders",
      status: "For Canvassing",
      items: [
        { materialId: "mat-14", materialName: "A4 Bond Paper 80gsm (500 Sheets)", unit: "Ream", qty: 40, estUnitPrice: 245 },
        { materialId: "mat-16", materialName: "Heavy-Duty Arch Lever Folders", unit: "Box (12s)", qty: 6, estUnitPrice: 1440 }
      ]
    },
    // RBI Requisitions
    {
      id: "req-rbi-1",
      companyId: "comp-rbi",
      reqNo: "RBI-REQ-2026-0001",
      projectId: "proj-rbi-1",
      department: "Engineering",
      category: "Construction Materials",
      requestedBy: "Engr. Camille Bautista",
      dateRequested: "2026-10-05",
      dateNeeded: "2026-10-14",
      purpose: "Sheet pile retaining wall & Class A riprap stone for Agusan River Floodway",
      status: "PR Generated",
      items: [
        { materialId: "mat-rbi-2", materialName: "Sheet Steel Pile Grade SY390 (12m)", unit: "Length", qty: 65, estUnitPrice: 18400 },
        { materialId: "mat-rbi-4", materialName: "Boulder Riprap Stone (Class A)", unit: "cu.m.", qty: 310, estUnitPrice: 1480 }
      ]
    },
    {
      id: "req-rbi-2",
      companyId: "comp-rbi",
      reqNo: "RBI-REQ-2026-0002",
      projectId: "proj-rbi-2",
      department: "Engineering",
      category: "Construction Materials",
      requestedBy: "Engr. Camille Bautista",
      dateRequested: "2026-10-20",
      dateNeeded: "2026-10-29",
      purpose: "Marine-grade concrete deck & 25mm bridge girders rebar batch",
      status: "PR Generated",
      items: [
        { materialId: "mat-rbi-5", materialName: "Ready-Mix Concrete 4500 PSI Marine Grade", unit: "cu.m.", qty: 160, estUnitPrice: 5950 },
        { materialId: "mat-rbi-3", materialName: "Deformed Rebar 25mm x 9m (Grade 60)", unit: "Length", qty: 350, estUnitPrice: 1290 }
      ]
    },
    {
      id: "req-rbi-3",
      companyId: "comp-rbi",
      reqNo: "RBI-REQ-2026-0003",
      projectId: "proj-rbi-3",
      department: "Purchasing",
      category: "Construction Materials",
      requestedBy: "Mark Anthony Lim",
      dateRequested: "2026-11-10",
      dateNeeded: "2026-11-24",
      purpose: "Warehouse roofing panels & pozzolan cement for Caraga Trade Complex",
      status: "For Canvassing",
      items: [
        { materialId: "mat-rbi-6", materialName: "Pre-Painted Rib-Type Roofing 0.5mm", unit: "Linear m", qty: 840, estUnitPrice: 420 },
        { materialId: "mat-rbi-1", materialName: "Pozzolan Cement Type IP (40kg)", unit: "Bag", qty: 500, estUnitPrice: 258 }
      ]
    }
  ],
  canvasses: [
    // RFB Canvasses
    {
      id: "cnv-1",
      companyId: "comp-rfb",
      canvassNo: "CNV-2026-0001",
      reqId: "req-1",
      reqNo: "REQ-2026-0001",
      projectId: "proj-1",
      category: "Construction Materials",
      dateOpened: "2026-10-03",
      preparedBy: "Maria Santos",
      status: "PR Created",
      quotes: [
        { id: "q-1", supplierId: "sup-4", supplierName: "Highland Asphalt & Bitumen Inc.", materialId: "mat-6", unitPrice: 5580, leadTimeDays: 3, remarks: "Delivered on site", isWinner: true },
        { id: "q-2", supplierId: "sup-1", supplierName: "Bukidnon Aggregates & Ready-Mix Corp.", materialId: "mat-6", unitPrice: 5900, leadTimeDays: 5, remarks: "Ex-plant price" },
        { id: "q-3", supplierId: "sup-1", supplierName: "Bukidnon Aggregates & Ready-Mix Corp.", materialId: "mat-4", unitPrice: 1290, leadTimeDays: 2, remarks: "Free dump truck delivery", isWinner: true },
        { id: "q-4", supplierId: "sup-3", supplierName: "Malaybalay Builders Supply Co.", materialId: "mat-4", unitPrice: 1380, leadTimeDays: 3, remarks: "Standard terms" }
      ]
    },
    {
      id: "cnv-2",
      companyId: "comp-rfb",
      canvassNo: "CNV-2026-0002",
      reqId: "req-2",
      reqNo: "REQ-2026-0002",
      projectId: "proj-2",
      category: "Construction Materials",
      dateOpened: "2026-10-15",
      preparedBy: "Maria Santos",
      status: "PR Created",
      quotes: [
        { id: "q-5", supplierId: "sup-2", supplierName: "Mindanao Steel & Rebar Trading", materialId: "mat-3", unitPrice: 715, leadTimeDays: 4, remarks: "Mill cert included", isWinner: true },
        { id: "q-6", supplierId: "sup-3", supplierName: "Malaybalay Builders Supply Co.", materialId: "mat-3", unitPrice: 760, leadTimeDays: 5, remarks: "Partial stock" },
        { id: "q-7", supplierId: "sup-1", supplierName: "Bukidnon Aggregates & Ready-Mix Corp.", materialId: "mat-7", unitPrice: 5250, leadTimeDays: 2, remarks: "With pumpcrete schedule", isWinner: true },
        { id: "q-8", supplierId: "sup-4", supplierName: "Highland Asphalt & Bitumen Inc.", materialId: "mat-7", unitPrice: 5450, leadTimeDays: 4, remarks: "Minimum 50 cu.m." }
      ]
    },
    {
      id: "cnv-3",
      companyId: "comp-rfb",
      canvassNo: "CNV-2026-0003",
      reqId: "req-3",
      reqNo: "REQ-2026-0003",
      projectId: "proj-3",
      category: "Construction Materials",
      dateOpened: "2026-11-05",
      preparedBy: "Maria Santos",
      status: "PR Created",
      quotes: [
        { id: "q-9", supplierId: "sup-3", supplierName: "Malaybalay Builders Supply Co.", materialId: "mat-1", unitPrice: 254, leadTimeDays: 2, remarks: "Direct warehouse pickup/delivery", isWinner: true },
        { id: "q-10", supplierId: "sup-1", supplierName: "Bukidnon Aggregates & Ready-Mix Corp.", materialId: "mat-1", unitPrice: 268, leadTimeDays: 3, remarks: "Standard" },
        { id: "q-11", supplierId: "sup-3", supplierName: "Malaybalay Builders Supply Co.", materialId: "mat-8", unitPrice: 22.5, leadTimeDays: 3, remarks: "Guaranteed compression test", isWinner: true },
        { id: "q-12", supplierId: "sup-1", supplierName: "Bukidnon Aggregates & Ready-Mix Corp.", materialId: "mat-8", unitPrice: 24.5, leadTimeDays: 4, remarks: "Standard" }
      ]
    },
    {
      id: "cnv-4",
      companyId: "comp-rfb",
      canvassNo: "CNV-2026-0004",
      reqId: "req-4",
      reqNo: "REQ-2026-0004",
      projectId: "proj-4",
      category: "ICT Equipment",
      dateOpened: "2026-11-13",
      preparedBy: "Maria Santos",
      status: "Open",
      quotes: [
        { id: "q-13", supplierId: "sup-5", supplierName: "Northern Mindanao ICT Solutions", materialId: "mat-10", unitPrice: 66200, leadTimeDays: 5, remarks: "3-yr warranty" }
      ]
    },
    // RBI Canvasses
    {
      id: "cnv-rbi-1",
      companyId: "comp-rbi",
      canvassNo: "RBI-CNV-2026-0001",
      reqId: "req-rbi-1",
      reqNo: "RBI-REQ-2026-0001",
      projectId: "proj-rbi-1",
      category: "Construction Materials",
      dateOpened: "2026-10-06",
      preparedBy: "Mark Anthony Lim",
      status: "PR Created",
      quotes: [
        { id: "qr-1", supplierId: "sup-rbi-2", supplierName: "Butuan Structural Steel Depot", materialId: "mat-rbi-2", unitPrice: 17650, leadTimeDays: 4, remarks: "Includes crane offload", isWinner: true },
        { id: "qr-2", supplierId: "sup-rbi-1", supplierName: "Caraga Quarry & Aggregates Inc.", materialId: "mat-rbi-2", unitPrice: 18500, leadTimeDays: 6, remarks: "Third-party haul" },
        { id: "qr-3", supplierId: "sup-rbi-1", supplierName: "Caraga Quarry & Aggregates Inc.", materialId: "mat-rbi-4", unitPrice: 1390, leadTimeDays: 2, remarks: "Quarry-direct dump haul", isWinner: true },
        { id: "qr-4", supplierId: "sup-rbi-4", supplierName: "Mindanao Civil Paving & Emulsions", materialId: "mat-rbi-4", unitPrice: 1520, leadTimeDays: 3, remarks: "Standard terms" }
      ]
    },
    {
      id: "cnv-rbi-2",
      companyId: "comp-rbi",
      canvassNo: "RBI-CNV-2026-0002",
      reqId: "req-rbi-2",
      reqNo: "RBI-REQ-2026-0002",
      projectId: "proj-rbi-2",
      category: "Construction Materials",
      dateOpened: "2026-10-21",
      preparedBy: "Mark Anthony Lim",
      status: "PR Created",
      quotes: [
        { id: "qr-5", supplierId: "sup-rbi-3", supplierName: "Agusan Ready-Mix & Cement Corp.", materialId: "mat-rbi-5", unitPrice: 5720, leadTimeDays: 2, remarks: "Pumpcrete included", isWinner: true },
        { id: "qr-6", supplierId: "sup-rbi-1", supplierName: "Caraga Quarry & Aggregates Inc.", materialId: "mat-rbi-5", unitPrice: 5980, leadTimeDays: 3, remarks: "Ex-batch plant" },
        { id: "qr-7", supplierId: "sup-rbi-2", supplierName: "Butuan Structural Steel Depot", materialId: "mat-rbi-3", unitPrice: 1230, leadTimeDays: 3, remarks: "Certified Grade 60", isWinner: true }
      ]
    },
    {
      id: "cnv-rbi-3",
      companyId: "comp-rbi",
      canvassNo: "RBI-CNV-2026-0003",
      reqId: "req-rbi-3",
      reqNo: "RBI-REQ-2026-0003",
      projectId: "proj-rbi-3",
      category: "Construction Materials",
      dateOpened: "2026-11-12",
      preparedBy: "Mark Anthony Lim",
      status: "Open",
      quotes: [
        { id: "qr-8", supplierId: "sup-rbi-2", supplierName: "Butuan Structural Steel Depot", materialId: "mat-rbi-6", unitPrice: 398, leadTimeDays: 3, remarks: "Pre-cut lengths" },
        { id: "qr-9", supplierId: "sup-rbi-3", supplierName: "Agusan Ready-Mix & Cement Corp.", materialId: "mat-rbi-1", unitPrice: 248, leadTimeDays: 2, remarks: "Palletized delivery" }
      ]
    }
  ],
  purchaseRequests: [
    // RFB PRs
    {
      id: "pr-1",
      companyId: "comp-rfb",
      prNo: "PR-2026-0001",
      canvassId: "cnv-1",
      canvassNo: "CNV-2026-0001",
      reqNo: "REQ-2026-0001",
      projectId: "proj-1",
      department: "Field Operations",
      dateCreated: "2026-10-04",
      status: "PO Generated",
      totalAmount: 1314e3,
      canvassSavings: 54e3,
      items: [
        { materialId: "mat-6", materialName: "Hot-Mix Asphalt Concrete (Item 310)", unit: "Metric Ton", qty: 180, unitPrice: 5580, supplierId: "sup-4", supplierName: "Highland Asphalt & Bitumen Inc." },
        { materialId: "mat-4", materialName: 'Crushed Gravel G1 (3/4")', unit: "cu.m.", qty: 240, unitPrice: 1290, supplierId: "sup-1", supplierName: "Bukidnon Aggregates & Ready-Mix Corp." }
      ],
      preparedBy: { employeeId: "emp-maria", name: "Maria Santos", position: "Purchasing Officer", date: "2026-10-04" },
      notedBy: { employeeId: "emp-peter", name: "Engr. Peter Villanueva", position: "Project Engineer", date: "2026-10-04" },
      recommendingApprovalBy: { employeeId: "emp-carlos", name: "Carlos Mendoza", position: "Finance Head", date: "2026-10-05" },
      approvedBy: { employeeId: "emp-roberto", name: "Roberto Aquino", position: "General Manager", date: "2026-10-05" }
    },
    {
      id: "pr-2",
      companyId: "comp-rfb",
      prNo: "PR-2026-0002",
      canvassId: "cnv-2",
      canvassNo: "CNV-2026-0002",
      reqNo: "REQ-2026-0002",
      projectId: "proj-2",
      department: "Engineering",
      dateCreated: "2026-10-16",
      status: "Approved",
      totalAmount: 1035300,
      canvassSavings: 33600,
      items: [
        { materialId: "mat-3", materialName: "Deformed Rebar 20mm x 6m (Grade 60)", unit: "Length", qty: 420, unitPrice: 715, supplierId: "sup-2", supplierName: "Mindanao Steel & Rebar Trading" },
        { materialId: "mat-7", materialName: "Ready-Mix Concrete 4000 PSI", unit: "cu.m.", qty: 140, unitPrice: 5250, supplierId: "sup-1", supplierName: "Bukidnon Aggregates & Ready-Mix Corp." }
      ],
      preparedBy: { employeeId: "emp-maria", name: "Maria Santos", position: "Purchasing Officer", date: "2026-10-16" },
      notedBy: { employeeId: "emp-peter", name: "Engr. Peter Villanueva", position: "Project Engineer", date: "2026-10-17" },
      recommendingApprovalBy: { employeeId: "emp-carlos", name: "Carlos Mendoza", position: "Finance Head", date: "2026-10-17" },
      approvedBy: { employeeId: "emp-roberto", name: "Roberto Aquino", position: "General Manager", date: "2026-10-18" }
    },
    {
      id: "pr-3",
      companyId: "comp-rfb",
      prNo: "PR-2026-0003",
      canvassId: "cnv-3",
      canvassNo: "CNV-2026-0003",
      reqNo: "REQ-2026-0003",
      projectId: "proj-3",
      department: "Field Operations",
      dateCreated: "2026-11-06",
      status: "For Recommending Approval",
      totalAmount: 266350,
      canvassSavings: 13900,
      items: [
        { materialId: "mat-1", materialName: "Portland Cement Type I (40kg)", unit: "Bag", qty: 650, unitPrice: 254, supplierId: "sup-3", supplierName: "Malaybalay Builders Supply Co." },
        { materialId: "mat-8", materialName: 'CHB 6" Load-Bearing Concrete Hollow Block', unit: "Piece", qty: 4500, unitPrice: 22.5, supplierId: "sup-3", supplierName: "Malaybalay Builders Supply Co." }
      ],
      preparedBy: { employeeId: "emp-maria", name: "Maria Santos", position: "Purchasing Officer", date: "2026-11-06" },
      notedBy: { employeeId: "emp-peter", name: "Engr. Peter Villanueva", position: "Project Engineer", date: "2026-11-07" }
    },
    // RBI PRs
    {
      id: "pr-rbi-1",
      companyId: "comp-rbi",
      prNo: "RBI-PR-2026-0001",
      canvassId: "cnv-rbi-1",
      canvassNo: "RBI-CNV-2026-0001",
      reqNo: "RBI-REQ-2026-0001",
      projectId: "proj-rbi-1",
      department: "Engineering",
      dateCreated: "2026-10-07",
      status: "PO Generated",
      totalAmount: 1578150,
      canvassSavings: 76650,
      items: [
        { materialId: "mat-rbi-2", materialName: "Sheet Steel Pile Grade SY390 (12m)", unit: "Length", qty: 65, unitPrice: 17650, supplierId: "sup-rbi-2", supplierName: "Butuan Structural Steel Depot" },
        { materialId: "mat-rbi-4", materialName: "Boulder Riprap Stone (Class A)", unit: "cu.m.", qty: 310, unitPrice: 1390, supplierId: "sup-rbi-1", supplierName: "Caraga Quarry & Aggregates Inc." }
      ],
      preparedBy: { employeeId: "emp-rbi-mark", name: "Mark Anthony Lim", position: "Procurement Specialist", date: "2026-10-07" },
      notedBy: { employeeId: "emp-rbi-camille", name: "Engr. Camille Bautista", position: "Senior Project Engineer", date: "2026-10-07" },
      recommendingApprovalBy: { employeeId: "emp-rbi-clarissa", name: "Clarissa Navarro", position: "Chief Accountant", date: "2026-10-08" },
      approvedBy: { employeeId: "emp-rbi-rodnet", name: "Engr. Rodnet Velasco", position: "President / Final Approver", date: "2026-10-08" }
    },
    {
      id: "pr-rbi-2",
      companyId: "comp-rbi",
      prNo: "RBI-PR-2026-0002",
      canvassId: "cnv-rbi-2",
      canvassNo: "RBI-CNV-2026-0002",
      reqNo: "RBI-REQ-2026-0002",
      projectId: "proj-rbi-2",
      department: "Engineering",
      dateCreated: "2026-10-22",
      status: "For Final Approval",
      totalAmount: 1345700,
      canvassSavings: 57800,
      items: [
        { materialId: "mat-rbi-5", materialName: "Ready-Mix Concrete 4500 PSI Marine Grade", unit: "cu.m.", qty: 160, unitPrice: 5720, supplierId: "sup-rbi-3", supplierName: "Agusan Ready-Mix & Cement Corp." },
        { materialId: "mat-rbi-3", materialName: "Deformed Rebar 25mm x 9m (Grade 60)", unit: "Length", qty: 350, unitPrice: 1230, supplierId: "sup-rbi-2", supplierName: "Butuan Structural Steel Depot" }
      ],
      preparedBy: { employeeId: "emp-rbi-mark", name: "Mark Anthony Lim", position: "Procurement Specialist", date: "2026-10-22" },
      notedBy: { employeeId: "emp-rbi-camille", name: "Engr. Camille Bautista", position: "Senior Project Engineer", date: "2026-10-23" },
      recommendingApprovalBy: { employeeId: "emp-rbi-clarissa", name: "Clarissa Navarro", position: "Chief Accountant", date: "2026-10-23" }
    }
  ],
  purchaseOrders: [
    // RFB POs
    {
      id: "po-1",
      companyId: "comp-rfb",
      poNo: "PO-2026-0001",
      prId: "pr-1",
      prNo: "PR-2026-0001",
      projectId: "proj-1",
      supplierId: "sup-4",
      supplierName: "Highland Asphalt & Bitumen Inc.",
      dateIssued: "2026-10-06",
      expectedDate: "2026-10-10",
      totalAmount: 1004400,
      status: "Delivered",
      items: [
        { materialId: "mat-6", materialName: "Hot-Mix Asphalt Concrete (Item 310)", unit: "Metric Ton", qty: 180, unitPrice: 5580, supplierId: "sup-4", supplierName: "Highland Asphalt & Bitumen Inc." }
      ]
    },
    {
      id: "po-2",
      companyId: "comp-rfb",
      poNo: "PO-2026-0002",
      prId: "pr-1",
      prNo: "PR-2026-0001",
      projectId: "proj-1",
      supplierId: "sup-1",
      supplierName: "Bukidnon Aggregates & Ready-Mix Corp.",
      dateIssued: "2026-10-06",
      expectedDate: "2026-10-09",
      totalAmount: 309600,
      status: "Delivered",
      items: [
        { materialId: "mat-4", materialName: 'Crushed Gravel G1 (3/4")', unit: "cu.m.", qty: 240, unitPrice: 1290, supplierId: "sup-1", supplierName: "Bukidnon Aggregates & Ready-Mix Corp." }
      ]
    },
    // RBI POs
    {
      id: "po-rbi-1",
      companyId: "comp-rbi",
      poNo: "RBI-PO-2026-0001",
      prId: "pr-rbi-1",
      prNo: "RBI-PR-2026-0001",
      projectId: "proj-rbi-1",
      supplierId: "sup-rbi-2",
      supplierName: "Butuan Structural Steel Depot",
      dateIssued: "2026-10-09",
      expectedDate: "2026-10-14",
      totalAmount: 1147250,
      status: "Delivered",
      items: [
        { materialId: "mat-rbi-2", materialName: "Sheet Steel Pile Grade SY390 (12m)", unit: "Length", qty: 65, unitPrice: 17650, supplierId: "sup-rbi-2", supplierName: "Butuan Structural Steel Depot" }
      ]
    },
    {
      id: "po-rbi-2",
      companyId: "comp-rbi",
      poNo: "RBI-PO-2026-0002",
      prId: "pr-rbi-1",
      prNo: "RBI-PR-2026-0001",
      projectId: "proj-rbi-1",
      supplierId: "sup-rbi-1",
      supplierName: "Caraga Quarry & Aggregates Inc.",
      dateIssued: "2026-10-09",
      expectedDate: "2026-10-13",
      totalAmount: 430900,
      status: "Issued",
      items: [
        { materialId: "mat-rbi-4", materialName: "Boulder Riprap Stone (Class A)", unit: "cu.m.", qty: 310, unitPrice: 1390, supplierId: "sup-rbi-1", supplierName: "Caraga Quarry & Aggregates Inc." }
      ]
    }
  ],
  receivingReports: [
    // RFB RRs
    {
      id: "rr-1",
      companyId: "comp-rfb",
      rrNo: "RR-2026-0001",
      poId: "po-1",
      poNo: "PO-2026-0001",
      projectId: "proj-1",
      supplierId: "sup-4",
      supplierName: "Highland Asphalt & Bitumen Inc.",
      invoiceNo: "SI-88412",
      deliveryReceiptNo: "DR-4410",
      dateReceived: "2026-10-10",
      receivedBy: "Ramil Torres",
      receivedAmount: 1004400,
      conditionNotes: "Complete 180 MT delivered at Bukidnon Provincial Road batching site"
    },
    {
      id: "rr-2",
      companyId: "comp-rfb",
      rrNo: "RR-2026-0002",
      poId: "po-2",
      poNo: "PO-2026-0002",
      projectId: "proj-1",
      supplierId: "sup-1",
      supplierName: "Bukidnon Aggregates & Ready-Mix Corp.",
      invoiceNo: "SI-22918",
      deliveryReceiptNo: "DR-1904",
      dateReceived: "2026-10-09",
      receivedBy: "Ramil Torres",
      receivedAmount: 309600,
      conditionNotes: "240 cu.m. G1 gravel verified by site checker"
    },
    // RBI RRs
    {
      id: "rr-rbi-1",
      companyId: "comp-rbi",
      rrNo: "RBI-RR-2026-0001",
      poId: "po-rbi-1",
      poNo: "RBI-PO-2026-0001",
      projectId: "proj-rbi-1",
      supplierId: "sup-rbi-2",
      supplierName: "Butuan Structural Steel Depot",
      invoiceNo: "BSSD-44901",
      deliveryReceiptNo: "DR-9021",
      dateReceived: "2026-10-14",
      receivedBy: "Dennis Ocampo",
      receivedAmount: 1147250,
      conditionNotes: "65 lengths SY390 sheet piles verified with mill certificates at Agusan Floodway"
    }
  ],
  vouchers: [
    // RFB Vouchers
    {
      id: "dv-1",
      companyId: "comp-rfb",
      dvNo: "DV-2026-0001",
      poId: "po-1",
      poNo: "PO-2026-0001",
      rrId: "rr-1",
      rrNo: "RR-2026-0001",
      projectId: "proj-1",
      supplierId: "sup-4",
      supplierName: "Highland Asphalt & Bitumen Inc.",
      department: "Field Operations",
      invoiceNo: "SI-88412",
      poAmount: 1004400,
      rrAmount: 1004400,
      invoiceAmount: 1004400,
      threeWayMatched: true,
      dateCreated: "2026-10-11",
      dueDate: "2026-11-10",
      status: "Paid",
      preparedBy: "Ana Reyes",
      approvedBy: "Carlos Mendoza",
      dateApproved: "2026-10-12",
      paidDate: "2026-10-14",
      paymentMethod: "Check",
      paymentRef: "CHK-0049182",
      remarks: "3-way matched payment for Bukidnon Provincial Road asphalt batch 1"
    },
    {
      id: "dv-2",
      companyId: "comp-rfb",
      dvNo: "DV-2026-0002",
      poId: "po-2",
      poNo: "PO-2026-0002",
      rrId: "rr-2",
      rrNo: "RR-2026-0002",
      projectId: "proj-1",
      supplierId: "sup-1",
      supplierName: "Bukidnon Aggregates & Ready-Mix Corp.",
      department: "Field Operations",
      invoiceNo: "SI-22918",
      poAmount: 309600,
      rrAmount: 309600,
      invoiceAmount: 309600,
      threeWayMatched: true,
      dateCreated: "2026-10-12",
      dueDate: "2026-11-11",
      status: "Approved",
      preparedBy: "Ana Reyes",
      approvedBy: "Carlos Mendoza",
      dateApproved: "2026-10-13",
      remarks: "Approved for check release \u2014 G1 aggregates"
    },
    // RBI Vouchers
    {
      id: "dv-rbi-1",
      companyId: "comp-rbi",
      dvNo: "RBI-DV-2026-0001",
      poId: "po-rbi-1",
      poNo: "RBI-PO-2026-0001",
      rrId: "rr-rbi-1",
      rrNo: "RBI-RR-2026-0001",
      projectId: "proj-rbi-1",
      supplierId: "sup-rbi-2",
      supplierName: "Butuan Structural Steel Depot",
      department: "Engineering",
      invoiceNo: "BSSD-44901",
      poAmount: 1147250,
      rrAmount: 1147250,
      invoiceAmount: 1147250,
      threeWayMatched: true,
      dateCreated: "2026-10-15",
      dueDate: "2026-11-14",
      status: "Paid",
      preparedBy: "Clarissa Navarro",
      approvedBy: "Engr. Rodnet Velasco",
      dateApproved: "2026-10-16",
      paidDate: "2026-10-18",
      paymentMethod: "Bank Transfer",
      paymentRef: "LBP-TR-881204",
      remarks: "3-way matched payment for SY390 Sheet Piles \u2014 Agusan River Floodway"
    }
  ],
  accounts: [
    // RFB COA
    { companyId: "comp-rfb", code: "1010", name: "Cash in Bank - Operating", type: "Asset", normalBalance: "Debit" },
    { companyId: "comp-rfb", code: "1100", name: "Accounts Receivable - Progress Billings", type: "Asset", normalBalance: "Debit" },
    { companyId: "comp-rfb", code: "1200", name: "Construction Materials Inventory", type: "Asset", normalBalance: "Debit" },
    { companyId: "comp-rfb", code: "1500", name: "Tools & Equipment Asset", type: "Asset", normalBalance: "Debit" },
    { companyId: "comp-rfb", code: "2010", name: "Accounts Payable - Suppliers", type: "Liability", normalBalance: "Credit" },
    { companyId: "comp-rfb", code: "3010", name: "RFB Owners Equity / Capital", type: "Equity", normalBalance: "Credit" },
    { companyId: "comp-rfb", code: "4010", name: "Contract Revenue - Roads & Bridges", type: "Revenue", normalBalance: "Credit" },
    { companyId: "comp-rfb", code: "5010", name: "Direct Project Materials Cost", type: "Expense", normalBalance: "Debit" },
    { companyId: "comp-rfb", code: "5020", name: "Tools Repair & Maintenance Expense", type: "Expense", normalBalance: "Debit" },
    { companyId: "comp-rfb", code: "5030", name: "ICT & General Admin Expense", type: "Expense", normalBalance: "Debit" },
    // RBI COA
    { companyId: "comp-rbi", code: "1010", name: "Cash in Bank - RBI Operating", type: "Asset", normalBalance: "Debit" },
    { companyId: "comp-rbi", code: "1100", name: "Accounts Receivable - Progress Billings", type: "Asset", normalBalance: "Debit" },
    { companyId: "comp-rbi", code: "1200", name: "Construction Materials Inventory", type: "Asset", normalBalance: "Debit" },
    { companyId: "comp-rbi", code: "1500", name: "Tools & Survey Equipment Asset", type: "Asset", normalBalance: "Debit" },
    { companyId: "comp-rbi", code: "2010", name: "Accounts Payable - Suppliers", type: "Liability", normalBalance: "Credit" },
    { companyId: "comp-rbi", code: "3010", name: "Rodnet Builders Share Capital", type: "Equity", normalBalance: "Credit" },
    { companyId: "comp-rbi", code: "4010", name: "Contract Revenue - Infrastructure & Floodway", type: "Revenue", normalBalance: "Credit" },
    { companyId: "comp-rbi", code: "5010", name: "Direct Project Materials Cost", type: "Expense", normalBalance: "Debit" },
    { companyId: "comp-rbi", code: "5020", name: "Equipment Repair & Maintenance Expense", type: "Expense", normalBalance: "Debit" },
    { companyId: "comp-rbi", code: "5030", name: "Site Operations & Admin Expense", type: "Expense", normalBalance: "Debit" }
  ],
  journalEntries: [
    // RFB Journal Entries
    {
      id: "je-1",
      companyId: "comp-rfb",
      jeNo: "JE-2026-0001",
      date: "2026-10-01",
      reference: "OPENING-2026",
      description: "Opening working capital & project mobilization fund",
      postedBy: "Ana Reyes",
      lines: [
        { accountCode: "1010", accountName: "Cash in Bank - Operating", debit: 15e6, credit: 0 },
        { accountCode: "3010", accountName: "RFB Owners Equity / Capital", debit: 0, credit: 15e6 }
      ]
    },
    {
      id: "je-2",
      companyId: "comp-rfb",
      jeNo: "JE-2026-0002",
      date: "2026-10-09",
      reference: "RR-2026-0002",
      projectId: "proj-1",
      description: "Accrual for G1 Gravel delivery \u2014 Bukidnon Aggregates & Ready-Mix Corp.",
      postedBy: "Ramil Torres",
      lines: [
        { accountCode: "5010", accountName: "Direct Project Materials Cost", debit: 309600, credit: 0 },
        { accountCode: "2010", accountName: "Accounts Payable - Suppliers", debit: 0, credit: 309600 }
      ]
    },
    {
      id: "je-3",
      companyId: "comp-rfb",
      jeNo: "JE-2026-0003",
      date: "2026-10-10",
      reference: "RR-2026-0001",
      projectId: "proj-1",
      description: "Accrual for Hot-Mix Asphalt delivery \u2014 Highland Asphalt & Bitumen Inc.",
      postedBy: "Ramil Torres",
      lines: [
        { accountCode: "5010", accountName: "Direct Project Materials Cost", debit: 1004400, credit: 0 },
        { accountCode: "2010", accountName: "Accounts Payable - Suppliers", debit: 0, credit: 1004400 }
      ]
    },
    {
      id: "je-4",
      companyId: "comp-rfb",
      jeNo: "JE-2026-0004",
      date: "2026-10-14",
      reference: "DV-2026-0001",
      projectId: "proj-1",
      description: "Disbursement settlement for DV-2026-0001 (Check CHK-0049182)",
      postedBy: "Ana Reyes",
      lines: [
        { accountCode: "2010", accountName: "Accounts Payable - Suppliers", debit: 1004400, credit: 0 },
        { accountCode: "1010", accountName: "Cash in Bank - Operating", debit: 0, credit: 1004400 }
      ]
    },
    {
      id: "je-5",
      companyId: "comp-rfb",
      jeNo: "JE-2026-0005",
      date: "2026-10-25",
      reference: "PB-2026-001",
      projectId: "proj-1",
      description: "Progress Billing #1 recognized \u2014 Bukidnon Provincial Road",
      postedBy: "Ana Reyes",
      lines: [
        { accountCode: "1100", accountName: "Accounts Receivable - Progress Billings", debit: 285e4, credit: 0 },
        { accountCode: "4010", accountName: "Contract Revenue - Roads & Bridges", debit: 0, credit: 285e4 }
      ]
    },
    // RBI Journal Entries
    {
      id: "je-rbi-1",
      companyId: "comp-rbi",
      jeNo: "RBI-JE-2026-0001",
      date: "2026-10-01",
      reference: "RBI-OPEN-2026",
      description: "RBI Opening working capital & Caraga operations fund",
      postedBy: "Clarissa Navarro",
      lines: [
        { accountCode: "1010", accountName: "Cash in Bank - RBI Operating", debit: 18e6, credit: 0 },
        { accountCode: "3010", accountName: "Rodnet Builders Share Capital", debit: 0, credit: 18e6 }
      ]
    },
    {
      id: "je-rbi-2",
      companyId: "comp-rbi",
      jeNo: "RBI-JE-2026-0002",
      date: "2026-10-14",
      reference: "RBI-RR-2026-0001",
      projectId: "proj-rbi-1",
      description: "Accrual for SY390 Sheet Piles \u2014 Butuan Structural Steel Depot",
      postedBy: "Dennis Ocampo",
      lines: [
        { accountCode: "5010", accountName: "Direct Project Materials Cost", debit: 1147250, credit: 0 },
        { accountCode: "2010", accountName: "Accounts Payable - Suppliers", debit: 0, credit: 1147250 }
      ]
    },
    {
      id: "je-rbi-3",
      companyId: "comp-rbi",
      jeNo: "RBI-JE-2026-0003",
      date: "2026-10-18",
      reference: "RBI-DV-2026-0001",
      projectId: "proj-rbi-1",
      description: "Cash disbursement for RBI-DV-2026-0001 (Ref LBP-TR-881204)",
      postedBy: "Clarissa Navarro",
      lines: [
        { accountCode: "2010", accountName: "Accounts Payable - Suppliers", debit: 1147250, credit: 0 },
        { accountCode: "1010", accountName: "Cash in Bank - RBI Operating", debit: 0, credit: 1147250 }
      ]
    },
    {
      id: "je-rbi-4",
      companyId: "comp-rbi",
      jeNo: "RBI-JE-2026-0004",
      date: "2026-10-28",
      reference: "RBI-PB-2026-001",
      projectId: "proj-rbi-1",
      description: "Progress Billing #1 \u2014 Agusan River Floodway & Slope Protection",
      postedBy: "Clarissa Navarro",
      lines: [
        { accountCode: "1100", accountName: "Accounts Receivable - Progress Billings", debit: 345e4, credit: 0 },
        { accountCode: "4010", accountName: "Contract Revenue - Infrastructure & Floodway", debit: 0, credit: 345e4 }
      ]
    },
    {
      id: "je-rbi-5",
      companyId: "comp-rbi",
      jeNo: "RBI-JE-2026-0005",
      date: "2026-11-04",
      reference: "OR-2026-0112",
      projectId: "proj-rbi-1",
      description: "Cash Receipt collection on Progress Billing #1 (OR-2026-0112)",
      postedBy: "Clarissa Navarro",
      lines: [
        { accountCode: "1010", accountName: "Cash in Bank - RBI Operating", debit: 22e5, credit: 0 },
        { accountCode: "1100", accountName: "Accounts Receivable - Progress Billings", debit: 0, credit: 22e5 }
      ]
    }
  ],
  tools: [
    // RFB Tools
    { id: "tl-1", companyId: "comp-rfb", assetCode: "RFB-TL-0001", name: "Makita Rotary Hammer Drill HR2470", category: "Power Tools", brandModel: "Makita HR2470", serialNo: "MK-992104", purchaseDate: "2025-06-12", purchaseCost: 14800, projectId: "proj-1", condition: "Good", status: "Borrowed" },
    { id: "tl-2", companyId: "comp-rfb", assetCode: "RFB-TL-0002", name: "One-Bagger Concrete Mixer", category: "Heavy Light Equipment", brandModel: "Robin EY20D", serialNo: "CM-441082", purchaseDate: "2025-03-20", purchaseCost: 42500, projectId: "proj-2", condition: "Good", status: "Available" },
    { id: "tl-3", companyId: "comp-rfb", assetCode: "RFB-TL-0003", name: "Inverter Welding Machine 300A", category: "Welding & Cutting", brandModel: "Fujihama TIG/MMA 300", serialNo: "FJ-772819", purchaseDate: "2025-08-05", purchaseCost: 18900, projectId: "proj-2", condition: "Good", status: "Borrowed" },
    { id: "tl-4", companyId: "comp-rfb", assetCode: "RFB-TL-0004", name: "Plate Compactor 5.5HP", category: "Compaction", brandModel: "Wacker Neuson VP1550", serialNo: "WN-310992", purchaseDate: "2025-01-18", purchaseCost: 58e3, projectId: "proj-1", condition: "Damaged", status: "Under Repair" },
    { id: "tl-5", companyId: "comp-rfb", assetCode: "RFB-TL-0005", name: "H-Frame Scaffolding Set (20 Frames)", category: "Formwork & Scaffolding", brandModel: "Galvanized 1.7m", serialNo: "SC-110220", purchaseDate: "2025-05-02", purchaseCost: 64e3, projectId: "proj-3", condition: "Good", status: "Available" },
    { id: "tl-6", companyId: "comp-rfb", assetCode: "RFB-TL-0006", name: "Total Station Surveying Instrument", category: "Surveying", brandModel: "Topcon GM-52", serialNo: "TC-883211", purchaseDate: "2025-09-14", purchaseCost: 195e3, projectId: "proj-1", condition: "Good", status: "Available" },
    { id: "tl-7", companyId: "comp-rfb", assetCode: "RFB-TL-0007", name: "Bosch Angle Grinder GWS 900", category: "Power Tools", brandModel: "Bosch GWS 900-100", serialNo: "BS-663102", purchaseDate: "2024-11-10", purchaseCost: 5200, projectId: "proj-3", condition: "Good", status: "Available" },
    { id: "tl-8", companyId: "comp-rfb", assetCode: "RFB-TL-0008", name: "Submersible Dewatering Pump 2HP", category: "Pumps", brandModel: "Tsurumi HS2.4S", serialNo: "TS-504911", purchaseDate: "2025-02-28", purchaseCost: 26400, projectId: "proj-2", condition: "Minor Wear", status: "Lost" },
    // RBI Tools
    { id: "tl-rbi-1", companyId: "comp-rbi", assetCode: "RBI-TL-0001", name: "Vibratory Vibro-Hammer Concrete Vibrator", category: "Compaction", brandModel: "Honda GX160", serialNo: "RB-210441", purchaseDate: "2025-04-10", purchaseCost: 34500, projectId: "proj-rbi-1", condition: "Good", status: "Borrowed" },
    { id: "tl-rbi-2", companyId: "comp-rbi", assetCode: "RBI-TL-0002", name: "Trimble R8s GNSS Survey Receiver", category: "Surveying", brandModel: "Trimble R8s", serialNo: "TR-998120", purchaseDate: "2025-07-19", purchaseCost: 245e3, projectId: "proj-rbi-2", condition: "Good", status: "Available" },
    { id: "tl-rbi-3", companyId: "comp-rbi", assetCode: "RBI-TL-0003", name: 'Diesel Dewatering Pump 4"', category: "Pumps", brandModel: "Koshin KTD-100", serialNo: "KS-551029", purchaseDate: "2025-02-11", purchaseCost: 48e3, projectId: "proj-rbi-1", condition: "Good", status: "Available" }
  ],
  borrowRequests: [
    // RFB Borrow Requests
    {
      id: "br-1",
      companyId: "comp-rfb",
      trNo: "TR-2026-0001",
      toolId: "tl-1",
      toolAssetCode: "RFB-TL-0001",
      toolName: "Makita Rotary Hammer Drill HR2470",
      borrowerEmployeeId: "emp-juan",
      borrowerName: "Juan Dela Cruz",
      borrowerPosition: "Site Engineer",
      department: "Field Operations",
      projectId: "proj-1",
      purpose: "Anchor bolt drilling for Bukidnon Provincial Road drainage headwall",
      requestDate: "2026-11-01",
      expectedReturnDate: "2026-11-10",
      status: "Released",
      approvedBy: "Engr. Peter Villanueva",
      approvedDate: "2026-11-01",
      releasedBy: "Ramil Torres",
      releasedByEmployeeId: "emp-ramil",
      releaseDate: "2026-11-02",
      releaseCondition: "Good \u2014 complete with hard case and 3 SDS bits"
    },
    {
      id: "br-2",
      companyId: "comp-rfb",
      trNo: "TR-2026-0002",
      toolId: "tl-3",
      toolAssetCode: "RFB-TL-0003",
      toolName: "Inverter Welding Machine 300A",
      borrowerEmployeeId: "emp-peter",
      borrowerName: "Engr. Peter Villanueva",
      borrowerPosition: "Project Engineer",
      department: "Engineering",
      projectId: "proj-2",
      purpose: "Pier rebar splicing at Pulangi River Bridge",
      requestDate: "2026-11-14",
      expectedReturnDate: "2026-11-28",
      status: "Released",
      approvedBy: "Roberto Aquino",
      approvedDate: "2026-11-14",
      releasedBy: "Ramil Torres",
      releasedByEmployeeId: "emp-ramil",
      releaseDate: "2026-11-15",
      releaseCondition: "Good \u2014 with electrode holder & ground clamp"
    },
    {
      id: "br-3",
      companyId: "comp-rfb",
      trNo: "TR-2026-0003",
      toolId: "tl-2",
      toolAssetCode: "RFB-TL-0002",
      toolName: "One-Bagger Concrete Mixer",
      borrowerEmployeeId: "emp-juan",
      borrowerName: "Juan Dela Cruz",
      borrowerPosition: "Site Engineer",
      department: "Field Operations",
      projectId: "proj-3",
      purpose: "Footing tie-beam concrete pouring at Valencia / Manolo site",
      requestDate: "2026-11-19",
      expectedReturnDate: "2026-11-27",
      status: "Pending Approval"
    },
    // RBI Borrow Requests
    {
      id: "br-rbi-1",
      companyId: "comp-rbi",
      trNo: "RBI-TR-2026-0001",
      toolId: "tl-rbi-1",
      toolAssetCode: "RBI-TL-0001",
      toolName: "Vibratory Vibro-Hammer Concrete Vibrator",
      borrowerEmployeeId: "emp-rbi-camille",
      borrowerName: "Engr. Camille Bautista",
      borrowerPosition: "Senior Project Engineer",
      department: "Engineering",
      projectId: "proj-rbi-1",
      purpose: "Floodway retaining wall concrete consolidation",
      requestDate: "2026-11-08",
      expectedReturnDate: "2026-11-25",
      status: "Released",
      approvedBy: "Engr. Rodnet Velasco",
      approvedDate: "2026-11-08",
      releasedBy: "Dennis Ocampo",
      releasedByEmployeeId: "emp-rbi-dennis",
      releaseDate: "2026-11-09",
      releaseCondition: "Good \u2014 full fuel tank & 6m poker hose"
    }
  ],
  toolAuditLogs: [
    { id: "tal-1", companyId: "comp-rfb", toolId: "tl-1", assetCode: "RFB-TL-0001", toolName: "Makita Rotary Hammer Drill HR2470", action: "Borrow Requested", actor: "Juan Dela Cruz", timestamp: "2026-11-01 08:30", remarks: "Requested for drainage headwall drilling (TR-2026-0001)" },
    { id: "tal-2", companyId: "comp-rfb", toolId: "tl-1", assetCode: "RFB-TL-0001", toolName: "Makita Rotary Hammer Drill HR2470", action: "Approved", actor: "Engr. Peter Villanueva", timestamp: "2026-11-01 10:15", remarks: "Approved for field deployment" },
    { id: "tal-3", companyId: "comp-rfb", toolId: "tl-1", assetCode: "RFB-TL-0001", toolName: "Makita Rotary Hammer Drill HR2470", action: "Released", actor: "Ramil Torres", timestamp: "2026-11-02 07:45", remarks: "Released with hard case and 3 SDS bits" },
    { id: "tal-4", companyId: "comp-rfb", toolId: "tl-4", assetCode: "RFB-TL-0004", toolName: "Plate Compactor 5.5HP", action: "Sent to Repair", actor: "Ramil Torres", timestamp: "2026-11-10 14:20", remarks: "Clutch belt & throttle cable replacement" },
    { id: "tal-5", companyId: "comp-rfb", toolId: "tl-8", assetCode: "RFB-TL-0008", toolName: "Submersible Dewatering Pump 2HP", action: "Reported Lost", actor: "Juan Dela Cruz", timestamp: "2026-11-12 17:05", remarks: "Missing after flash flood at Pulangi River cofferdam" },
    { id: "tal-rbi-1", companyId: "comp-rbi", toolId: "tl-rbi-1", assetCode: "RBI-TL-0001", toolName: "Vibratory Vibro-Hammer Concrete Vibrator", action: "Released", actor: "Dennis Ocampo", timestamp: "2026-11-09 08:15", remarks: "Deployed to Agusan River Floodway" }
  ],
  repairRecords: [
    {
      id: "rep-1",
      companyId: "comp-rfb",
      toolId: "tl-4",
      assetCode: "RFB-TL-0004",
      toolName: "Plate Compactor 5.5HP",
      dateSent: "2026-11-10",
      technician: "Malaybalay Motor & Equipment Works",
      issueDescription: "Worn drive clutch belt and snapped throttle cable",
      partsReplaced: "V-Belt B34, Throttle Cable Assembly",
      repairCost: 3850,
      status: "In Progress"
    }
  ],
  disposalRecords: [],
  auditLogs: [
    {
      id: "aud-1",
      userId: "usr-maria",
      username: "maria",
      userName: "Maria Santos",
      companyId: "comp-rfb",
      companyCode: "RFB",
      companyName: "RFB Construction",
      action: "Created Purchase Request",
      module: "purchasing",
      targetId: "PR-2026-0003",
      details: "Converted Canvass CNV-2026-0003 into PR-2026-0003 (\u20B1266,350)",
      timestamp: "2026-11-06 09:42:10"
    },
    {
      id: "aud-2",
      userId: "usr-peter",
      username: "peter",
      userName: "Engr. Peter Villanueva",
      companyId: "comp-rfb",
      companyCode: "RFB",
      companyName: "RFB Construction",
      action: "Approved Step (Noted By)",
      module: "purchasing",
      targetId: "PR-2026-0003",
      details: "Signed Noted By on PR-2026-0003; routed to Recommending Approval",
      timestamp: "2026-11-07 11:15:04"
    },
    {
      id: "aud-3",
      userId: "usr-user-d",
      username: "user_d",
      userName: "Clarissa Navarro",
      companyId: "comp-rbi",
      companyCode: "RBI",
      companyName: "RBI Construction",
      action: "Posted Cash Receipt Journal",
      module: "accounting",
      targetId: "RBI-JE-2026-0005",
      details: "Collected \u20B12,200,000 on Agusan River Floodway Progress Billing #1",
      timestamp: "2026-11-04 15:20:33"
    }
  ]
};

// server/erpBackend.ts
var SESSION_SECRET = process.env.ERP_SESSION_SECRET || import_crypto.default.randomBytes(32).toString("hex");
var DB_FILE_PATH = process.env.VERCEL ? "/tmp/rfb-rbi-erp-db-v3.json" : import_path.default.join(process.cwd(), ".data", "erp-db-v3.json");
var LEGACY_DB_FILE_PATH = process.env.VERCEL ? "/tmp/rfb-rbi-erp-db-v2.json" : import_path.default.join(process.cwd(), ".data", "erp-db-v2.json");
var revokedSessionIds = /* @__PURE__ */ new Set();
var userInvalidatedBefore = /* @__PURE__ */ new Map();
function nowTimestamp() {
  const d = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function todayISO() {
  const d = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function hashPassword(plain) {
  const salt = import_crypto.default.randomBytes(16).toString("hex");
  const derived = import_crypto.default.scryptSync(plain, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");
  return `scrypt$${salt}$${derived}`;
}
function verifyPassword(plain, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = import_crypto.default.scryptSync(plain, salt, 64, { N: 16384, r: 8, p: 1 });
    const expected = Buffer.from(expectedHex, "hex");
    if (derived.length !== expected.length) return false;
    return import_crypto.default.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
var VALID_PROJECT_STATUSES = [
  "Planning",
  "Not Yet Started",
  "Ongoing",
  "On Hold",
  "Completed",
  "Cancelled"
];
function isManagementUser(user, access) {
  if (user.isAdmin) return true;
  const labels = `${user.position || ""} ${user.roleLabel || ""} ${access?.roleLabel || ""}`;
  return /(head|vice president|\bvp\b|administrator)/i.test(labels);
}
function sanitizeCompanyAccessForRole(user, accessList) {
  const mgmt = isManagementUser(user);
  return accessList.map((a) => {
    const allowedSet = new Set(a.allowedModules || []);
    const permSet = new Set(a.permissions || []);
    if (!mgmt) {
      allowedSet.delete("dashboard");
      allowedSet.delete("projects");
      permSet.delete("view_dashboard");
      permSet.delete("export_csv");
    } else {
      if (allowedSet.size > 0) {
        allowedSet.add("projects");
      }
      if (allowedSet.has("reports") && permSet.has("export_reports")) {
        permSet.add("export_csv");
      }
    }
    return {
      ...a,
      allowedModules: Array.from(allowedSet),
      permissions: Array.from(permSet)
    };
  });
}
function normalizeProjectRecord(raw, seedProjectsMap) {
  const seed = seedProjectsMap.get(raw.id);
  const rawStatus = String(raw.status || "");
  const mappedStatus = rawStatus === "Active" ? "Ongoing" : VALID_PROJECT_STATUSES.includes(rawStatus) ? rawStatus : seed?.status || "Ongoing";
  const progressNum = Number.isFinite(Number(raw.progress)) ? Math.max(0, Math.min(100, Math.round(Number(raw.progress)))) : mappedStatus === "Completed" ? 100 : seed?.progress ?? 0;
  return {
    id: raw.id,
    companyId: raw.companyId,
    code: String(raw.code || seed?.code || "").trim(),
    name: String(raw.name || seed?.name || "").trim(),
    type: raw.type || seed?.type || "Road",
    location: raw.location || seed?.location || "P-1 A Brgy. Doongan, Butuan City, Agusan Del Norte",
    clientOwner: raw.clientOwner || seed?.clientOwner || "Private / Government Client",
    description: raw.description || seed?.description || `${raw.name} construction & engineering works.`,
    manager: raw.manager || seed?.manager || "Project Engineer",
    startDate: raw.startDate || seed?.startDate || todayISO(),
    targetCompletionDate: raw.targetCompletionDate || seed?.targetCompletionDate || "2027-06-30",
    actualCompletionDate: raw.actualCompletionDate || seed?.actualCompletionDate || (mappedStatus === "Completed" ? todayISO() : void 0),
    budget: Number(raw.budget) || seed?.budget || 0,
    status: mappedStatus,
    progress: mappedStatus === "Completed" ? 100 : progressNum,
    remarks: raw.remarks !== void 0 ? raw.remarks : seed?.remarks || ""
  };
}
function normalizeUserRecord(raw) {
  const passwordHash = raw.passwordHash && raw.passwordHash.startsWith("scrypt$") ? raw.passwordHash : hashPassword(raw.password || raw.username);
  const rawAccess = Array.isArray(raw.companyAccess) ? raw.companyAccess : [];
  const sanitizedAccess = sanitizeCompanyAccessForRole(raw, rawAccess);
  const mergedModules = raw.isAdmin ? ALL_MODULE_IDS : Array.from(
    /* @__PURE__ */ new Set([
      ...sanitizedAccess.flatMap((a) => a.allowedModules),
      ...Array.isArray(raw.allowedModules) ? raw.allowedModules.filter(
        (m) => isManagementUser(raw) || m !== "dashboard" && m !== "projects"
      ) : []
    ])
  );
  return {
    id: raw.id,
    username: raw.username,
    passwordHash,
    employeeCode: raw.employeeCode || `EMP-${raw.username.toUpperCase().slice(0, 6)}`,
    fullName: raw.fullName || raw.username,
    department: raw.department || "Operations",
    position: raw.position || raw.roleLabel || "Staff",
    employeeId: raw.employeeId || "",
    roleLabel: raw.roleLabel || raw.position || "Staff",
    isAdmin: Boolean(raw.isAdmin),
    accountStatus: raw.accountStatus || "Active",
    employmentStatus: raw.employmentStatus || "Regular",
    mustChangePassword: Boolean(raw.mustChangePassword),
    dateCreated: raw.dateCreated || todayISO(),
    lastLogin: raw.lastLogin,
    createdBy: raw.createdBy || "System Setup",
    updatedBy: raw.updatedBy || "System Setup",
    updatedAt: raw.updatedAt,
    passwordUpdatedAt: raw.passwordUpdatedAt,
    allowedModules: mergedModules,
    companyAccess: sanitizedAccess
  };
}
function cloneInitialState() {
  const seed = JSON.parse(JSON.stringify(INITIAL_ERP_STATE));
  seed.users = seed.users.map(normalizeUserRecord);
  return seed;
}
function loadDatabase() {
  try {
    if (import_fs.default.existsSync(DB_FILE_PATH)) {
      const raw = import_fs.default.readFileSync(DB_FILE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.companies) && Array.isArray(parsed.users) && parsed.companies.length >= 2) {
        const base = cloneInitialState();
        const seedProjMap = new Map(base.projects.map((p) => [p.id, p]));
        return {
          ...base,
          ...parsed,
          projects: Array.isArray(parsed.projects) ? parsed.projects.map((p) => normalizeProjectRecord(p, seedProjMap)) : base.projects,
          users: parsed.users.map(normalizeUserRecord),
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : base.auditLogs
        };
      }
    }
    if (import_fs.default.existsSync(LEGACY_DB_FILE_PATH)) {
      const rawLegacy = import_fs.default.readFileSync(LEGACY_DB_FILE_PATH, "utf8");
      const parsedLegacy = JSON.parse(rawLegacy);
      if (parsedLegacy && Array.isArray(parsedLegacy.companies) && parsedLegacy.companies.length >= 2) {
        const base = cloneInitialState();
        const seedProjMap = new Map(base.projects.map((p) => [p.id, p]));
        const existingEmpIds = new Set(base.employees.map((e) => e.id));
        const mergedEmployees = [
          ...base.employees,
          ...Array.isArray(parsedLegacy.employees) ? parsedLegacy.employees.filter((e) => !existingEmpIds.has(e.id)) : []
        ];
        return {
          ...base,
          ...parsedLegacy,
          projects: Array.isArray(parsedLegacy.projects) ? parsedLegacy.projects.map((p) => normalizeProjectRecord(p, seedProjMap)) : base.projects,
          employees: mergedEmployees,
          users: base.users,
          auditLogs: Array.isArray(parsedLegacy.auditLogs) ? parsedLegacy.auditLogs : base.auditLogs
        };
      }
    }
  } catch {
  }
  return cloneInitialState();
}
var db = loadDatabase();
function persistDatabase() {
  try {
    const dir = import_path.default.dirname(DB_FILE_PATH);
    if (!import_fs.default.existsSync(dir)) {
      import_fs.default.mkdirSync(dir, { recursive: true });
    }
    import_fs.default.writeFileSync(DB_FILE_PATH, JSON.stringify(db), "utf8");
  } catch {
  }
}
function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = import_crypto.default.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verifyToken(token) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = import_crypto.default.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!import_crypto.default.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!parsed.uid || !parsed.exp || Date.now() > parsed.exp) return null;
    if (revokedSessionIds.has(parsed.sid)) return null;
    const minIat = userInvalidatedBefore.get(parsed.uid);
    if (minIat && (parsed.iat || 0) < minIat) return null;
    return parsed;
  } catch {
    return null;
  }
}
function sanitizeUser(u) {
  return {
    id: u.id,
    username: u.username,
    employeeCode: u.employeeCode,
    fullName: u.fullName,
    department: u.department,
    position: u.position,
    employeeId: u.employeeId,
    roleLabel: u.roleLabel,
    isAdmin: u.isAdmin,
    accountStatus: u.accountStatus,
    employmentStatus: u.employmentStatus,
    mustChangePassword: u.mustChangePassword,
    dateCreated: u.dateCreated,
    lastLogin: u.lastLogin,
    createdBy: u.createdBy,
    updatedBy: u.updatedBy,
    updatedAt: u.updatedAt,
    passwordUpdatedAt: u.passwordUpdatedAt,
    allowedModules: u.allowedModules,
    companyAccess: u.companyAccess
  };
}
function getEffectiveAccess(user, companyId) {
  if (user.accountStatus !== "Active") return null;
  const assigned = user.companyAccess.find((a) => a.companyId === companyId);
  if (user.isAdmin) {
    return assigned || {
      companyId,
      roleLabel: user.roleLabel || "System Administrator",
      allowedModules: ALL_MODULE_IDS,
      permissions: ALL_PERMISSION_IDS
    };
  }
  return assigned || null;
}
function getAssignedCompanies(user) {
  if (user.accountStatus !== "Active") return [];
  if (user.isAdmin) {
    return db.companies.filter((c) => c.isActive);
  }
  const ids = new Set(user.companyAccess.map((a) => a.companyId));
  return db.companies.filter((c) => c.isActive && ids.has(c.id));
}
function hasPerm(access, user, perm) {
  return user.isAdmin || access.permissions.includes(perm);
}
function hasModule(access, user, mod) {
  return user.isAdmin || access.allowedModules.includes(mod);
}
function appendAudit(user, company, action, module2, details, targetId) {
  const emp = db.employees.find((e) => e.id === user.employeeId);
  const entry = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
    userId: user.id,
    username: user.username,
    userName: user.fullName || emp?.name || user.username,
    companyId: company?.id || "system",
    companyCode: company?.code || "SYS",
    companyName: company?.name || "Central Auth",
    action,
    module: module2,
    targetId,
    details,
    timestamp: nowTimestamp()
  };
  db.auditLogs = [entry, ...db.auditLogs].slice(0, 600);
}
function buildCompanyScopedState(user, access, companyId) {
  const canManageUsers = hasPerm(access, user, "manage_users");
  const canManageCompanies = hasPerm(access, user, "manage_companies");
  const safeUsers = canManageUsers ? db.users.map((u) => sanitizeUser(u)) : [];
  return {
    companies: canManageCompanies ? db.companies : getAssignedCompanies(user),
    projects: db.projects.filter((r) => r.companyId === companyId),
    suppliers: db.suppliers.filter((r) => r.companyId === companyId),
    materials: db.materials.filter((r) => r.companyId === companyId),
    employees: db.employees.filter((r) => r.companyId === companyId),
    users: safeUsers,
    requisitions: db.requisitions.filter((r) => r.companyId === companyId),
    canvasses: db.canvasses.filter((r) => r.companyId === companyId),
    purchaseRequests: db.purchaseRequests.filter((r) => r.companyId === companyId),
    purchaseOrders: db.purchaseOrders.filter((r) => r.companyId === companyId),
    receivingReports: db.receivingReports.filter((r) => r.companyId === companyId),
    vouchers: db.vouchers.filter((r) => r.companyId === companyId),
    accounts: db.accounts.filter((r) => r.companyId === companyId),
    journalEntries: db.journalEntries.filter((r) => r.companyId === companyId),
    tools: db.tools.filter((r) => r.companyId === companyId),
    borrowRequests: db.borrowRequests.filter((r) => r.companyId === companyId),
    toolAuditLogs: db.toolAuditLogs.filter((r) => r.companyId === companyId),
    repairRecords: db.repairRecords.filter((r) => r.companyId === companyId),
    disposalRecords: db.disposalRecords.filter((r) => r.companyId === companyId),
    auditLogs: db.auditLogs.filter((r) => r.companyId === companyId || user.isAdmin && r.companyId === "system")
  };
}
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const session = verifyToken(token);
  if (!session) {
    res.status(401).json({ error: "Invalid or expired session token" });
    return;
  }
  const user = db.users.find((u) => u.id === session.uid);
  if (!user) {
    res.status(401).json({ error: "Account no longer exists" });
    return;
  }
  if (user.accountStatus !== "Active") {
    res.status(403).json({
      error: `Account is ${user.accountStatus}. Access disabled; contact a System Administrator.`
    });
    return;
  }
  req.session = session;
  req.user = user;
  next();
}
var ENFORCE_FIRST_LOGIN_PASSWORD_CHANGE = false;
function requireActiveCompany(req, res, next) {
  if (!req.session || !req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (ENFORCE_FIRST_LOGIN_PASSWORD_CHANGE && req.user.mustChangePassword) {
    res.status(403).json({ error: "Password change required before accessing company workspaces." });
    return;
  }
  const companyId = req.session.cid;
  if (!companyId) {
    res.status(403).json({ error: "No active company selected. Please select a company first." });
    return;
  }
  const company = db.companies.find((c) => c.id === companyId && c.isActive);
  if (!company) {
    res.status(403).json({ error: "Selected company is inactive or not found." });
    return;
  }
  const access = getEffectiveAccess(req.user, companyId);
  if (!access) {
    res.status(403).json({ error: "Forbidden: User is not assigned to this company." });
    return;
  }
  req.activeCompany = company;
  req.activeAccess = access;
  next();
}
function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  const bytes = import_crypto.default.randomBytes(10);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}
var COLLECTION_MODULE_MAP = {
  projects: { module: "masterData", label: "Project" },
  suppliers: { module: "masterData", label: "Supplier" },
  materials: { module: "masterData", label: "Material" },
  employees: { module: "masterData", label: "Employee" },
  requisitions: { module: "requisitions", label: "Requisition" },
  canvasses: { module: "canvassing", label: "Canvass" },
  purchaseRequests: { module: "purchasing", label: "Purchase Request" },
  purchaseOrders: { module: "orders", label: "Purchase Order" },
  receivingReports: { module: "orders", label: "Receiving Report" },
  vouchers: { module: "vouchers", label: "Disbursement Voucher" },
  accounts: { module: "accounting", label: "Chart Account" },
  journalEntries: { module: "accounting", label: "Journal Entry" },
  tools: { module: "tools", label: "Tool Asset" },
  borrowRequests: { module: "tools", label: "Borrow Request" },
  toolAuditLogs: { module: "tools", label: "Tool Audit Log" },
  repairRecords: { module: "tools", label: "Tool Repair" },
  disposalRecords: { module: "tools", label: "Tool Disposal" }
};
function getItemKey(col, item) {
  if (col === "accounts") return String(item.code || "");
  return String(item.id || "");
}
function getReadableRef(item) {
  return String(
    item.prNo || item.poNo || item.dvNo || item.reqNo || item.canvassNo || item.rrNo || item.jeNo || item.trNo || item.assetCode || item.code || item.name || item.id || ""
  );
}
function createErpBackendRouter() {
  const router2 = import_express.default.Router();
  router2.use(import_express.default.json({ limit: "6mb" }));
  router2.get("/health", (_req, res) => {
    res.json({ ok: true, companies: db.companies.length, users: db.users.length, timestamp: nowTimestamp() });
  });
  router2.get("/auth/demo-directory", (_req, res) => {
    const directory = db.users.filter((u) => u.accountStatus === "Active").map((u) => {
      const emp = db.employees.find((e) => e.id === u.employeeId);
      const companies = getAssignedCompanies(u).map((c) => ({ id: c.id, code: c.code, name: c.name }));
      const initialSetupOnly = Boolean(u.mustChangePassword && verifyPassword(u.username, u.passwordHash));
      return {
        id: u.id,
        username: u.username,
        employeeName: u.fullName || emp?.name || u.username,
        department: u.department,
        position: u.position,
        roleLabel: u.roleLabel,
        isAdmin: u.isAdmin,
        mustChangePassword: u.mustChangePassword,
        initialSetupTempMatchesUsername: initialSetupOnly,
        companies
      };
    });
    res.json({ users: directory });
  });
  router2.post("/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required." });
      return;
    }
    const found = db.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!found || !verifyPassword(password, found.passwordHash)) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }
    if (found.accountStatus !== "Active") {
      appendAudit(
        found,
        null,
        "Blocked Login Attempt",
        "auth",
        `Login denied because account status is ${found.accountStatus}`
      );
      persistDatabase();
      res.status(403).json({
        error: `This account is currently ${found.accountStatus}. Please contact a System Administrator.`
      });
      return;
    }
    const availableCompanies = getAssignedCompanies(found);
    if (availableCompanies.length === 0) {
      res.status(403).json({ error: "No active companies are assigned to your account. Contact Administrator." });
      return;
    }
    found.lastLogin = nowTimestamp();
    const sid = import_crypto.default.randomBytes(16).toString("hex");
    const token = signToken({
      sid,
      uid: found.id,
      cid: null,
      iat: Date.now(),
      exp: Date.now() + 12 * 60 * 60 * 1e3
    });
    const emp = db.employees.find((e) => e.id === found.employeeId) || null;
    appendAudit(
      found,
      null,
      "User Login",
      "auth",
      `Authenticated centralized session (${availableCompanies.map((c) => c.code).join(", ")} assigned)${ENFORCE_FIRST_LOGIN_PASSWORD_CHANGE && found.mustChangePassword ? " \xB7 password change required" : ""}`
    );
    persistDatabase();
    res.json({
      token,
      user: sanitizeUser(found),
      availableCompanies,
      employee: emp,
      mustChangePassword: ENFORCE_FIRST_LOGIN_PASSWORD_CHANGE && Boolean(found.mustChangePassword)
    });
  });
  router2.post("/auth/change-password", requireAuth, (req, res) => {
    const user = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ error: "Current password, new password, and confirmation are required." });
      return;
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: "Current password is incorrect." });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: "New password and confirmation do not match." });
      return;
    }
    if (newPassword.toLowerCase() === user.username.toLowerCase()) {
      res.status(400).json({ error: "New password cannot be the same as your username." });
      return;
    }
    if (verifyPassword(newPassword, user.passwordHash)) {
      res.status(400).json({ error: "New password must be different from your temporary/current password." });
      return;
    }
    user.passwordHash = hashPassword(newPassword);
    user.mustChangePassword = false;
    user.passwordUpdatedAt = nowTimestamp();
    user.updatedBy = user.username;
    user.updatedAt = nowTimestamp();
    const comp = req.session?.cid ? db.companies.find((c) => c.id === req.session.cid) || null : null;
    appendAudit(
      user,
      comp,
      "Password Changed",
      "auth",
      `User ${user.username} updated their password cleanly`
    );
    persistDatabase();
    res.json({
      ok: true,
      user: sanitizeUser(user)
    });
  });
  router2.post("/auth/select-company", requireAuth, (req, res) => {
    const user = req.user;
    const session = req.session;
    const { companyId } = req.body;
    if (ENFORCE_FIRST_LOGIN_PASSWORD_CHANGE && user.mustChangePassword) {
      res.status(403).json({ error: "You must change your temporary password before entering a company workspace." });
      return;
    }
    if (!companyId) {
      res.status(400).json({ error: "companyId is required." });
      return;
    }
    const company = db.companies.find((c) => c.id === companyId && c.isActive);
    if (!company) {
      res.status(404).json({ error: "Company not found or inactive." });
      return;
    }
    const access = getEffectiveAccess(user, companyId);
    if (!access) {
      appendAudit(
        user,
        company,
        "Unauthorized Company Access Attempt",
        "company",
        `Blocked attempt to access ${company.code} without assignment`,
        companyId
      );
      persistDatabase();
      res.status(403).json({ error: `Access denied: You are not authorized to access ${company.name}.` });
      return;
    }
    const isSwitch = Boolean(session.cid && session.cid !== companyId);
    const updatedToken = signToken({
      sid: session.sid,
      uid: user.id,
      cid: companyId,
      iat: session.iat || Date.now(),
      exp: Date.now() + 12 * 60 * 60 * 1e3
    });
    appendAudit(
      user,
      company,
      isSwitch ? "Company Switched" : "Company Selected",
      "company",
      `${isSwitch ? "Switched active workspace to" : "Entered workspace"} ${company.name} (${company.code}) as ${access.roleLabel}`,
      company.id
    );
    persistDatabase();
    const emp = db.employees.find((e) => e.id === user.employeeId) || null;
    const scopedState = buildCompanyScopedState(user, access, companyId);
    res.json({
      token: updatedToken,
      activeCompany: company,
      activeAccess: access,
      employee: emp,
      state: scopedState
    });
  });
  router2.post("/auth/logout", requireAuth, (req, res) => {
    const session = req.session;
    const user = req.user;
    revokedSessionIds.add(session.sid);
    const comp = session.cid ? db.companies.find((c) => c.id === session.cid) || null : null;
    appendAudit(user, comp, "User Logout", "auth", "Session terminated by user");
    persistDatabase();
    res.json({ ok: true });
  });
  router2.get("/erp/state", requireAuth, requireActiveCompany, (req, res) => {
    const scoped = buildCompanyScopedState(req.user, req.activeAccess, req.activeCompany.id);
    res.json({
      activeCompany: req.activeCompany,
      activeAccess: req.activeAccess,
      state: scoped
    });
  });
  router2.get("/erp/audit-logs", requireAuth, requireActiveCompany, (req, res) => {
    const companyId = req.activeCompany.id;
    res.json({
      auditLogs: db.auditLogs.filter(
        (l) => l.companyId === companyId || req.user.isAdmin && l.companyId === "system"
      )
    });
  });
  router2.post("/erp/users", requireAuth, requireActiveCompany, (req, res) => {
    const actor = req.user;
    const access = req.activeAccess;
    const company = req.activeCompany;
    if (!hasPerm(access, actor, "manage_users")) {
      res.status(403).json({ error: "Forbidden: Missing manage_users permission." });
      return;
    }
    const body = req.body;
    const username = (body.username || "").trim().toLowerCase();
    const fullName = (body.fullName || "").trim();
    const tempPass = (body.temporaryPassword || body.password || "").trim();
    if (!username || !fullName || !tempPass) {
      res.status(400).json({ error: "Username, Employee Name, and Temporary Password are required." });
      return;
    }
    if (tempPass.length < 6) {
      res.status(400).json({ error: "Temporary password must be at least 6 characters." });
      return;
    }
    if (db.users.some((u) => u.username.toLowerCase() === username)) {
      res.status(409).json({ error: `Username "${username}" already exists.` });
      return;
    }
    const isAdmin = Boolean(body.isAdmin);
    const roleMeta = {
      isAdmin,
      position: (body.position || "").trim() || body.roleLabel?.trim() || "Staff",
      roleLabel: (body.roleLabel || "").trim() || (body.position || "").trim() || "Staff"
    };
    const rawCompanyAccess = isAdmin ? db.companies.map((c) => ({
      companyId: c.id,
      roleLabel: body.roleLabel?.trim() || "System Administrator",
      allowedModules: ALL_MODULE_IDS,
      permissions: ALL_PERMISSION_IDS
    })) : Array.isArray(body.companyAccess) ? body.companyAccess : [];
    const companyAccess = isAdmin ? rawCompanyAccess : sanitizeCompanyAccessForRole(roleMeta, rawCompanyAccess);
    if (!isAdmin && companyAccess.length === 0) {
      res.status(400).json({ error: "Assign at least one company (RFB, RBI, or both)." });
      return;
    }
    let employeeId = (body.employeeId || "").trim();
    if (!employeeId) {
      const targetCompanyId = companyAccess[0]?.companyId || company.id;
      const empId = `emp-${Date.now()}`;
      const targetComp = db.companies.find((c) => c.id === targetCompanyId) || company;
      const domain = targetComp.email.split("@")[1] || "rfbconstruction.ph";
      db.employees.push({
        id: empId,
        companyId: targetCompanyId,
        name: fullName,
        position: roleMeta.position,
        department: body.department?.trim() || "Operations",
        email: `${username}@${domain}`
      });
      employeeId = empId;
    }
    const mergedModules = Array.from(new Set(companyAccess.flatMap((a) => a.allowedModules)));
    const created = {
      id: `usr-${Date.now()}`,
      username,
      passwordHash: hashPassword(tempPass),
      employeeCode: (body.employeeCode || "").trim() || `EMP-${username.toUpperCase().slice(0, 6)}`,
      fullName,
      department: (body.department || "").trim() || "Operations",
      position: roleMeta.position,
      employeeId,
      roleLabel: roleMeta.roleLabel,
      isAdmin,
      accountStatus: body.accountStatus || "Active",
      employmentStatus: body.employmentStatus || "Regular",
      mustChangePassword: body.mustChangePassword !== false,
      dateCreated: todayISO(),
      createdBy: actor.username,
      updatedBy: actor.username,
      updatedAt: nowTimestamp(),
      allowedModules: isAdmin ? ALL_MODULE_IDS : mergedModules,
      companyAccess
    };
    db.users.push(created);
    appendAudit(
      actor,
      company,
      "Created User Account",
      "masterData",
      `Created user ${created.username} (${created.fullName} \xB7 ${created.companyAccess.map((a) => db.companies.find((c) => c.id === a.companyId)?.code || a.companyId).join(" + ")})`,
      created.username
    );
    persistDatabase();
    res.status(201).json({
      ok: true,
      user: sanitizeUser(created),
      state: buildCompanyScopedState(actor, access, company.id)
    });
  });
  router2.put("/erp/users/:id", requireAuth, requireActiveCompany, (req, res) => {
    const actor = req.user;
    const access = req.activeAccess;
    const company = req.activeCompany;
    if (!hasPerm(access, actor, "manage_users")) {
      res.status(403).json({ error: "Forbidden: Missing manage_users permission." });
      return;
    }
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: "User account not found." });
      return;
    }
    const body = req.body;
    const nextUsername = body.username ? body.username.trim().toLowerCase() : target.username;
    if (nextUsername !== target.username && db.users.some((u) => u.id !== target.id && u.username.toLowerCase() === nextUsername)) {
      res.status(409).json({ error: `Username "${nextUsername}" is already taken.` });
      return;
    }
    const isAdmin = body.isAdmin !== void 0 ? Boolean(body.isAdmin) : target.isAdmin;
    if (target.id === actor.id && !isAdmin && actor.isAdmin) {
      res.status(400).json({ error: "Cannot remove System Administrator privileges from your own active session." });
      return;
    }
    const nextPosition = body.position?.trim() || target.position;
    const nextRoleLabel = body.roleLabel?.trim() || target.roleLabel;
    const rawCompanyAccess = isAdmin ? db.companies.map((c) => ({
      companyId: c.id,
      roleLabel: nextRoleLabel || "System Administrator",
      allowedModules: ALL_MODULE_IDS,
      permissions: ALL_PERMISSION_IDS
    })) : Array.isArray(body.companyAccess) ? body.companyAccess : target.companyAccess;
    const companyAccess = isAdmin ? rawCompanyAccess : sanitizeCompanyAccessForRole(
      { isAdmin, position: nextPosition, roleLabel: nextRoleLabel },
      rawCompanyAccess
    );
    const mergedModules = Array.from(new Set(companyAccess.flatMap((a) => a.allowedModules)));
    target.username = nextUsername;
    target.fullName = body.fullName?.trim() || target.fullName;
    target.employeeCode = body.employeeCode?.trim() || target.employeeCode;
    target.department = body.department?.trim() || target.department;
    target.position = nextPosition;
    target.roleLabel = nextRoleLabel;
    target.employeeId = body.employeeId !== void 0 ? body.employeeId : target.employeeId;
    target.isAdmin = isAdmin;
    target.accountStatus = body.accountStatus || target.accountStatus;
    target.employmentStatus = body.employmentStatus || target.employmentStatus;
    target.allowedModules = isAdmin ? ALL_MODULE_IDS : mergedModules;
    target.companyAccess = companyAccess;
    target.updatedBy = actor.username;
    target.updatedAt = nowTimestamp();
    if (target.employeeId) {
      const emp = db.employees.find((e) => e.id === target.employeeId);
      if (emp) {
        emp.name = target.fullName;
        emp.position = target.position;
        emp.department = target.department;
      }
    }
    appendAudit(
      actor,
      company,
      "Updated User & RBAC",
      "masterData",
      `Updated ${target.username} (${target.fullName}) \xB7 Role: ${target.roleLabel} \xB7 Companies: ${companyAccess.map((a) => db.companies.find((c) => c.id === a.companyId)?.code || a.companyId).join(" + ")}`,
      target.username
    );
    persistDatabase();
    res.json({
      ok: true,
      user: sanitizeUser(target),
      state: buildCompanyScopedState(actor, access, company.id)
    });
  });
  router2.post("/erp/users/:id/reset-password", requireAuth, requireActiveCompany, (req, res) => {
    const actor = req.user;
    const access = req.activeAccess;
    const company = req.activeCompany;
    if (!hasPerm(access, actor, "manage_users")) {
      res.status(403).json({ error: "Forbidden: Missing manage_users permission." });
      return;
    }
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: "User account not found." });
      return;
    }
    const { temporaryPassword, generateRandom, forceChange } = req.body;
    const nextTemp = generateRandom ? generateTempPassword() : (temporaryPassword || "").trim();
    if (!nextTemp || nextTemp.length < 6) {
      res.status(400).json({ error: "Temporary password must be at least 6 characters." });
      return;
    }
    target.passwordHash = hashPassword(nextTemp);
    target.mustChangePassword = forceChange !== false;
    target.passwordUpdatedAt = nowTimestamp();
    target.updatedBy = actor.username;
    target.updatedAt = nowTimestamp();
    if (target.id !== actor.id) {
      userInvalidatedBefore.set(target.id, Date.now());
    }
    appendAudit(
      actor,
      company,
      "Admin Password Reset",
      "masterData",
      `Reset password for ${target.username} (${target.fullName}); force change on next login = ${target.mustChangePassword ? "Yes" : "No"}`,
      target.username
    );
    persistDatabase();
    res.json({
      ok: true,
      temporaryPassword: nextTemp,
      user: sanitizeUser(target),
      state: buildCompanyScopedState(actor, access, company.id)
    });
  });
  router2.post("/erp/users/:id/status", requireAuth, requireActiveCompany, (req, res) => {
    const actor = req.user;
    const access = req.activeAccess;
    const company = req.activeCompany;
    if (!hasPerm(access, actor, "manage_users")) {
      res.status(403).json({ error: "Forbidden: Missing manage_users permission." });
      return;
    }
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: "User account not found." });
      return;
    }
    if (target.id === actor.id) {
      res.status(400).json({ error: "You cannot deactivate or suspend your own active administrator account." });
      return;
    }
    const { accountStatus, employmentStatus, clearCompanyAccess } = req.body;
    if (!accountStatus || !["Active", "Inactive", "Resigned", "Suspended"].includes(accountStatus)) {
      res.status(400).json({ error: "Invalid accountStatus." });
      return;
    }
    const prevStatus = target.accountStatus;
    target.accountStatus = accountStatus;
    if (employmentStatus) {
      target.employmentStatus = employmentStatus;
    } else if (accountStatus === "Resigned") {
      target.employmentStatus = "Resigned";
    } else if (accountStatus === "Active") {
      target.employmentStatus = "Regular";
    }
    if (clearCompanyAccess) {
      target.companyAccess = [];
      target.allowedModules = [];
    }
    target.updatedBy = actor.username;
    target.updatedAt = nowTimestamp();
    if (accountStatus !== "Active") {
      userInvalidatedBefore.set(target.id, Date.now());
    }
    appendAudit(
      actor,
      company,
      `User Account ${accountStatus}`,
      "masterData",
      `Changed ${target.username} (${target.fullName}) status from ${prevStatus} to ${accountStatus}${clearCompanyAccess ? " and removed company access" : ""}. Historical transactions preserved.`,
      target.username
    );
    persistDatabase();
    res.json({
      ok: true,
      user: sanitizeUser(target),
      state: buildCompanyScopedState(actor, access, company.id)
    });
  });
  router2.delete("/erp/users/:id", requireAuth, requireActiveCompany, (req, res) => {
    const actor = req.user;
    const access = req.activeAccess;
    const company = req.activeCompany;
    if (!hasPerm(access, actor, "manage_users") || !actor.isAdmin && !hasPerm(access, actor, "delete_transactions")) {
      res.status(403).json({ error: "Forbidden: Missing permission to delete user accounts." });
      return;
    }
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: "User account not found." });
      return;
    }
    if (target.id === actor.id) {
      res.status(400).json({ error: "You cannot delete your own active administrator account." });
      return;
    }
    db.users = db.users.filter((u) => u.id !== target.id);
    userInvalidatedBefore.set(target.id, Date.now());
    appendAudit(
      actor,
      company,
      "Deleted User Account",
      "masterData",
      `Removed login account ${target.username} (${target.fullName}). All historical transactions and audit records preserved.`,
      target.username
    );
    persistDatabase();
    res.json({
      ok: true,
      state: buildCompanyScopedState(actor, access, company.id)
    });
  });
  function isProjectDelayed(p, today) {
    if (!p.targetCompletionDate) return false;
    if (p.status === "Completed" || p.status === "Cancelled") return false;
    return p.targetCompletionDate < today;
  }
  function daysBetweenISO(earlier, later) {
    const a = (/* @__PURE__ */ new Date(`${earlier}T00:00:00Z`)).getTime();
    const b = (/* @__PURE__ */ new Date(`${later}T00:00:00Z`)).getTime();
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
    return Math.max(0, Math.round((b - a) / 864e5));
  }
  function computeProjectMetrics(companyIds) {
    const today = todayISO();
    const idSet = new Set(companyIds);
    const scopedProjects = db.projects.filter((p) => idSet.has(p.companyId));
    const compMap = new Map(db.companies.map((c) => [c.id, c]));
    const poSpendByProj = /* @__PURE__ */ new Map();
    for (const po of db.purchaseOrders) {
      if (idSet.has(po.companyId) && po.status !== "Cancelled") {
        poSpendByProj.set(po.projectId, (poSpendByProj.get(po.projectId) || 0) + po.totalAmount);
      }
    }
    const statusCounts = {
      Planning: 0,
      "Not Yet Started": 0,
      Ongoing: 0,
      "On Hold": 0,
      Completed: 0,
      Cancelled: 0
    };
    let delayedProjects = 0;
    let totalBudget = 0;
    let totalActualSpend = 0;
    let progressSum = 0;
    const overdueProjects = [];
    const projectBudgetSeries = scopedProjects.map((p) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      const overdue = isProjectDelayed(p, today);
      if (overdue) {
        delayedProjects += 1;
        const comp2 = compMap.get(p.companyId);
        overdueProjects.push({
          ...p,
          companyCode: comp2?.code || "RFB",
          companyName: comp2?.name || "Company",
          daysOverdue: daysBetweenISO(p.targetCompletionDate, today)
        });
      }
      const actual = poSpendByProj.get(p.id) || 0;
      totalBudget += p.budget;
      totalActualSpend += actual;
      progressSum += p.progress;
      const comp = compMap.get(p.companyId);
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        companyCode: comp?.code || "RFB",
        type: p.type,
        budget: p.budget,
        actual,
        progress: p.progress,
        status: p.status,
        isOverdue: overdue
      };
    });
    overdueProjects.sort((a, b) => b.daysOverdue - a.daysOverdue);
    return {
      totalProjects: scopedProjects.length,
      planningProjects: statusCounts.Planning,
      notYetStartedProjects: statusCounts["Not Yet Started"],
      ongoingProjects: statusCounts.Ongoing,
      onHoldProjects: statusCounts["On Hold"],
      completedProjects: statusCounts.Completed,
      cancelledProjects: statusCounts.Cancelled,
      delayedProjects,
      totalBudget,
      totalActualSpend,
      avgProgress: scopedProjects.length > 0 ? Math.round(progressSum / scopedProjects.length) : 0,
      statusBreakdown: VALID_PROJECT_STATUSES.map((status) => ({
        status,
        count: statusCounts[status] || 0
      })),
      projectBudgetSeries,
      overdueProjects
    };
  }
  router2.get("/erp/dashboard", requireAuth, requireActiveCompany, (req, res) => {
    const user = req.user;
    const access = req.activeAccess;
    const company = req.activeCompany;
    const allowed = isManagementUser(user, access) && hasModule(access, user, "dashboard") && hasPerm(access, user, "view_dashboard");
    if (!allowed) {
      appendAudit(
        user,
        company,
        "Unauthorized Dashboard Access Blocked",
        "dashboard",
        `Blocked dashboard API request by ${user.username} (${access.roleLabel || user.position})`
      );
      persistDatabase();
      res.status(403).json({
        error: "Forbidden: Executive Dashboard access is restricted to System Administrators, Department Heads, and Vice Presidents."
      });
      return;
    }
    const assignedCompanies = getAssignedCompanies(user);
    const assignedIds = assignedCompanies.map((c) => c.id);
    const activeSummary = computeProjectMetrics([company.id]);
    const consolidatedSummary = computeProjectMetrics(assignedIds);
    const companyComparisons = assignedCompanies.map((comp) => {
      const m = computeProjectMetrics([comp.id]);
      return {
        companyId: comp.id,
        companyCode: comp.code,
        companyName: comp.name,
        totalProjects: m.totalProjects,
        ongoingProjects: m.ongoingProjects,
        completedProjects: m.completedProjects,
        delayedProjects: m.delayedProjects,
        totalBudget: m.totalBudget,
        actualSpend: m.totalActualSpend,
        avgProgress: m.avgProgress
      };
    });
    res.json({
      activeCompany: company,
      isConsolidatedAvailable: assignedCompanies.length > 1,
      assignedCompanyIds: assignedIds,
      activeSummary,
      consolidatedSummary,
      companyComparisons
    });
  });
  router2.post("/erp/reports/export-csv", requireAuth, requireActiveCompany, (req, res) => {
    const user = req.user;
    const access = req.activeAccess;
    const company = req.activeCompany;
    if (!hasModule(access, user, "reports") || !hasPerm(access, user, "generate_reports")) {
      res.status(403).json({ error: "Forbidden: Missing reports generation permission." });
      return;
    }
    const canExportCsv = isManagementUser(user, access) && hasPerm(access, user, "export_csv");
    if (!canExportCsv) {
      appendAudit(
        user,
        company,
        "Unauthorized CSV Export Blocked",
        "reports",
        `Blocked CSV report export attempt by ${user.username} (${access.roleLabel || user.position})`
      );
      persistDatabase();
      res.status(403).json({
        error: "Forbidden: CSV report export is restricted to System Administrators, Department Heads, and Vice Presidents. Print and PDF export remain available."
      });
      return;
    }
    const { filename, reportName, columns, rows } = req.body;
    if (!Array.isArray(columns) || !Array.isArray(rows)) {
      res.status(400).json({ error: "Invalid report dataset payload: columns and rows arrays are required." });
      return;
    }
    const escapeCsv = (val) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csvLines = [
      columns.map(escapeCsv).join(","),
      ...rows.map((r) => Array.isArray(r) ? r.map(escapeCsv).join(",") : "")
    ];
    const csvContent = csvLines.join("\n");
    const safeFilename = String(filename || `${company.code}_Report.csv`).replace(/[^a-zA-Z0-9._-]/g, "_");
    appendAudit(
      user,
      company,
      "Exported CSV Report",
      "reports",
      `Exported ${reportName || safeFilename} (${rows.length} rows)`
    );
    persistDatabase();
    res.json({
      ok: true,
      filename: safeFilename,
      csv: csvContent
    });
  });
  function enrichProject(p) {
    const today = todayISO();
    const comp = db.companies.find((c) => c.id === p.companyId);
    const actualSpend = db.purchaseOrders.filter((po) => po.companyId === p.companyId && po.projectId === p.id && po.status !== "Cancelled").reduce((sum, po) => sum + po.totalAmount, 0);
    const overdue = isProjectDelayed(p, today);
    return {
      ...p,
      companyCode: comp?.code || "RFB",
      companyName: comp?.name || "Company",
      actualSpend,
      isOverdue: overdue,
      daysOverdue: overdue ? daysBetweenISO(p.targetCompletionDate, today) : 0
    };
  }
  router2.get("/erp/projects", requireAuth, requireActiveCompany, (req, res) => {
    const user = req.user;
    const access = req.activeAccess;
    const activeCompany = req.activeCompany;
    const canViewProjects = isManagementUser(user, access) && (hasModule(access, user, "projects") || hasModule(access, user, "masterData") || hasModule(access, user, "dashboard"));
    const canViewPerm = hasPerm(access, user, "view_transactions") || hasPerm(access, user, "view_dashboard");
    if (!canViewProjects || !canViewPerm) {
      appendAudit(
        user,
        activeCompany,
        "Unauthorized Project Management Access Blocked",
        "projects",
        `Blocked Project Management read attempt by ${user.username} (${access.roleLabel || user.position})`
      );
      persistDatabase();
      res.status(403).json({
        error: "Forbidden: Project Management access is restricted to System Administrators, Department Heads, and Vice Presidents."
      });
      return;
    }
    const assignedCompanies = getAssignedCompanies(user);
    const assignedIds = new Set(assignedCompanies.map((c) => c.id));
    const requestedScope = req.query.scope === "consolidated" ? "consolidated" : "active";
    const requestedCompanyId = typeof req.query.companyId === "string" ? req.query.companyId.trim() : "";
    if (requestedCompanyId && !assignedIds.has(requestedCompanyId)) {
      appendAudit(
        user,
        activeCompany,
        "Cross-Company Project Read Blocked",
        "projects",
        `Blocked read for unassigned company ${requestedCompanyId}`
      );
      persistDatabase();
      res.status(403).json({ error: "Forbidden: You are not assigned to the requested company." });
      return;
    }
    const targetIds = requestedCompanyId ? /* @__PURE__ */ new Set([requestedCompanyId]) : requestedScope === "consolidated" && assignedCompanies.length > 1 ? assignedIds : /* @__PURE__ */ new Set([activeCompany.id]);
    const projects = db.projects.filter((p) => targetIds.has(p.companyId)).map(enrichProject);
    res.json({
      projects,
      assignedCompanies,
      isConsolidatedAvailable: assignedCompanies.length > 1,
      activeCompany
    });
  });
  router2.post("/erp/projects", requireAuth, requireActiveCompany, (req, res) => {
    const user = req.user;
    const access = req.activeAccess;
    const activeCompany = req.activeCompany;
    const body = req.body;
    const targetCompanyId = (body.companyId || activeCompany.id).trim();
    const targetCompany = db.companies.find((c) => c.id === targetCompanyId && c.isActive);
    if (!targetCompany) {
      res.status(404).json({ error: "Target company not found or inactive." });
      return;
    }
    const targetAccess = getEffectiveAccess(user, targetCompanyId);
    if (!targetAccess) {
      appendAudit(
        user,
        activeCompany,
        "Cross-Company Project Write Blocked",
        "projects",
        `Blocked attempt to create project in unassigned company ${targetCompany.code}`
      );
      persistDatabase();
      res.status(403).json({ error: `Forbidden: You do not have access to ${targetCompany.name}.` });
      return;
    }
    const canCreateInTarget = isManagementUser(user, targetAccess) && (hasModule(targetAccess, user, "projects") || hasModule(targetAccess, user, "masterData")) && hasPerm(targetAccess, user, "create_transactions");
    if (!canCreateInTarget) {
      res.status(403).json({
        error: "Forbidden: Project Management creation is restricted to System Administrators, Department Heads, and Vice Presidents."
      });
      return;
    }
    const code = String(body.code || "").trim().toUpperCase();
    const name = String(body.name || "").trim();
    const location = String(body.location || "").trim();
    const clientOwner = String(body.clientOwner || "").trim();
    const manager = String(body.manager || "").trim();
    const startDate = String(body.startDate || "").trim();
    const targetCompletionDate = String(body.targetCompletionDate || "").trim();
    const status = body.status || "Planning";
    if (!code || !name || !location || !manager || !startDate || !targetCompletionDate) {
      res.status(400).json({
        error: "Project Code, Name, Location, Project Manager, Start Date, and Target Completion Date are required."
      });
      return;
    }
    if (!VALID_PROJECT_STATUSES.includes(status)) {
      res.status(400).json({ error: "Invalid project status." });
      return;
    }
    const duplicate = db.projects.find(
      (p) => p.companyId === targetCompanyId && p.code.trim().toLowerCase() === code.toLowerCase()
    );
    if (duplicate) {
      res.status(409).json({
        error: `Duplicate Project Code: "${code}" already exists in ${targetCompany.name} (${targetCompany.code}).`
      });
      return;
    }
    const progressRaw = Number(body.progress);
    const progress = status === "Completed" ? 100 : Number.isFinite(progressRaw) ? Math.max(0, Math.min(100, Math.round(progressRaw))) : 0;
    const created = {
      id: `proj-${Date.now()}`,
      companyId: targetCompanyId,
      code,
      name,
      type: body.type || "Road",
      location,
      clientOwner: clientOwner || `${targetCompany.name} Client`,
      description: String(body.description || "").trim() || `${name} engineering and construction works.`,
      manager,
      startDate,
      targetCompletionDate,
      actualCompletionDate: body.actualCompletionDate || (status === "Completed" ? todayISO() : void 0),
      budget: Number(body.budget) || 0,
      status,
      progress,
      remarks: String(body.remarks || "").trim()
    };
    db.projects.push(created);
    appendAudit(
      user,
      targetCompany,
      "Created Project",
      "projects",
      `Registered ${created.code} \u2014 ${created.name} (${created.status}, ${created.progress}%)`,
      created.code
    );
    persistDatabase();
    res.status(201).json({
      ok: true,
      project: enrichProject(created),
      state: buildCompanyScopedState(user, access, activeCompany.id)
    });
  });
  router2.put("/erp/projects/:id", requireAuth, requireActiveCompany, (req, res) => {
    const user = req.user;
    const access = req.activeAccess;
    const activeCompany = req.activeCompany;
    const existing = db.projects.find((p) => p.id === req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Project not found." });
      return;
    }
    const existingAccess = getEffectiveAccess(user, existing.companyId);
    if (!existingAccess) {
      appendAudit(
        user,
        activeCompany,
        "Cross-Company Project Edit Blocked",
        "projects",
        `Blocked edit on ${existing.code} belonging to ${existing.companyId}`
      );
      persistDatabase();
      res.status(403).json({ error: "Forbidden: Cross-company project edit blocked." });
      return;
    }
    const canEditTarget = isManagementUser(user, existingAccess) && (hasModule(existingAccess, user, "projects") || hasModule(existingAccess, user, "masterData")) && hasPerm(existingAccess, user, "edit_transactions");
    if (!canEditTarget) {
      res.status(403).json({
        error: "Forbidden: Project Management edits are restricted to System Administrators, Department Heads, and Vice Presidents."
      });
      return;
    }
    const body = req.body;
    const nextCompanyId = (body.companyId || existing.companyId).trim();
    if (nextCompanyId !== existing.companyId) {
      const nextCompAccess = getEffectiveAccess(user, nextCompanyId);
      if (!nextCompAccess || !hasPerm(nextCompAccess, user, "edit_transactions")) {
        res.status(403).json({ error: "Forbidden: Cannot reassign project to an unauthorized company." });
        return;
      }
    }
    const nextCode = String(body.code ?? existing.code).trim().toUpperCase();
    const nextName = String(body.name ?? existing.name).trim();
    if (!nextCode || !nextName) {
      res.status(400).json({ error: "Project Code and Project Name are required." });
      return;
    }
    const duplicate = db.projects.find(
      (p) => p.id !== existing.id && p.companyId === nextCompanyId && p.code.trim().toLowerCase() === nextCode.toLowerCase()
    );
    if (duplicate) {
      const comp = db.companies.find((c) => c.id === nextCompanyId);
      res.status(409).json({
        error: `Duplicate Project Code: "${nextCode}" already exists in ${comp?.code || nextCompanyId}.`
      });
      return;
    }
    const nextStatus = body.status ?? existing.status;
    if (!VALID_PROJECT_STATUSES.includes(nextStatus)) {
      res.status(400).json({ error: "Invalid project status." });
      return;
    }
    const progressVal = body.progress !== void 0 ? Math.max(0, Math.min(100, Math.round(Number(body.progress) || 0))) : nextStatus === "Completed" ? 100 : existing.progress;
    const updated = {
      ...existing,
      companyId: nextCompanyId,
      code: nextCode,
      name: nextName,
      type: body.type || existing.type,
      location: body.location !== void 0 ? String(body.location).trim() : existing.location,
      clientOwner: body.clientOwner !== void 0 ? String(body.clientOwner).trim() : existing.clientOwner,
      description: body.description !== void 0 ? String(body.description).trim() : existing.description,
      manager: body.manager !== void 0 ? String(body.manager).trim() : existing.manager,
      startDate: body.startDate || existing.startDate,
      targetCompletionDate: body.targetCompletionDate || existing.targetCompletionDate,
      actualCompletionDate: body.actualCompletionDate !== void 0 ? body.actualCompletionDate || void 0 : nextStatus === "Completed" ? existing.actualCompletionDate || todayISO() : existing.actualCompletionDate,
      budget: body.budget !== void 0 ? Number(body.budget) || 0 : existing.budget,
      status: nextStatus,
      progress: nextStatus === "Completed" ? 100 : progressVal,
      remarks: body.remarks !== void 0 ? String(body.remarks).trim() : existing.remarks
    };
    db.projects = db.projects.map((p) => p.id === existing.id ? updated : p);
    const targetComp = db.companies.find((c) => c.id === updated.companyId) || activeCompany;
    appendAudit(
      user,
      targetComp,
      "Updated Project",
      "projects",
      `Updated ${updated.code} \u2014 ${updated.name} (${updated.status}, ${updated.progress}%)`,
      updated.code
    );
    persistDatabase();
    res.json({
      ok: true,
      project: enrichProject(updated),
      state: buildCompanyScopedState(user, access, activeCompany.id)
    });
  });
  router2.patch("/erp/projects/:id/status", requireAuth, requireActiveCompany, (req, res) => {
    const user = req.user;
    const access = req.activeAccess;
    const activeCompany = req.activeCompany;
    const existing = db.projects.find((p) => p.id === req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Project not found." });
      return;
    }
    const existingAccess = getEffectiveAccess(user, existing.companyId);
    if (!existingAccess) {
      res.status(403).json({ error: "Forbidden: Cross-company project update blocked." });
      return;
    }
    const canUpdateStatus = isManagementUser(user, existingAccess) && (hasModule(existingAccess, user, "projects") || hasModule(existingAccess, user, "masterData")) && (hasPerm(existingAccess, user, "edit_transactions") || hasPerm(existingAccess, user, "process_transactions") || hasPerm(existingAccess, user, "approve_transactions"));
    if (!canUpdateStatus) {
      res.status(403).json({
        error: "Forbidden: Project Management status updates are restricted to System Administrators, Department Heads, and Vice Presidents."
      });
      return;
    }
    const { status, progress, actualCompletionDate, remarks } = req.body;
    const nextStatus = status || existing.status;
    if (!VALID_PROJECT_STATUSES.includes(nextStatus)) {
      res.status(400).json({ error: "Invalid project status." });
      return;
    }
    const nextProgress = nextStatus === "Completed" ? 100 : progress !== void 0 ? Math.max(0, Math.min(100, Math.round(Number(progress) || 0))) : existing.progress;
    const updated = {
      ...existing,
      status: nextStatus,
      progress: nextProgress,
      actualCompletionDate: actualCompletionDate !== void 0 ? actualCompletionDate || void 0 : nextStatus === "Completed" ? existing.actualCompletionDate || todayISO() : existing.actualCompletionDate,
      remarks: remarks !== void 0 ? String(remarks).trim() : existing.remarks
    };
    db.projects = db.projects.map((p) => p.id === existing.id ? updated : p);
    const targetComp = db.companies.find((c) => c.id === updated.companyId) || activeCompany;
    appendAudit(
      user,
      targetComp,
      "Updated Project Status",
      "projects",
      `${updated.code}: ${existing.status} (${existing.progress}%) \u2192 ${updated.status} (${updated.progress}%)`,
      updated.code
    );
    persistDatabase();
    res.json({
      ok: true,
      project: enrichProject(updated),
      state: buildCompanyScopedState(user, access, activeCompany.id)
    });
  });
  router2.delete("/erp/projects/:id", requireAuth, requireActiveCompany, (req, res) => {
    const user = req.user;
    const access = req.activeAccess;
    const activeCompany = req.activeCompany;
    const existing = db.projects.find((p) => p.id === req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Project not found." });
      return;
    }
    const existingAccess = getEffectiveAccess(user, existing.companyId);
    if (!existingAccess) {
      res.status(403).json({ error: "Forbidden: Cross-company project delete blocked." });
      return;
    }
    const canDelete = isManagementUser(user, existingAccess) && (hasModule(existingAccess, user, "projects") || hasModule(existingAccess, user, "masterData")) && hasPerm(existingAccess, user, "delete_transactions");
    if (!canDelete) {
      res.status(403).json({
        error: "Forbidden: Project Management deletion is restricted to System Administrators, Department Heads, and Vice Presidents."
      });
      return;
    }
    const hasLinkedDocs = db.requisitions.some((r) => r.projectId === existing.id) || db.purchaseOrders.some((po) => po.projectId === existing.id) || db.vouchers.some((v) => v.projectId === existing.id);
    if (hasLinkedDocs) {
      res.status(409).json({
        error: `Cannot delete ${existing.code}: active requisitions, purchase orders, or vouchers reference this project. Set status to Cancelled instead.`
      });
      return;
    }
    db.projects = db.projects.filter((p) => p.id !== existing.id);
    const targetComp = db.companies.find((c) => c.id === existing.companyId) || activeCompany;
    appendAudit(
      user,
      targetComp,
      "Deleted Project",
      "projects",
      `Deleted project ${existing.code} \u2014 ${existing.name}`,
      existing.code
    );
    persistDatabase();
    res.json({
      ok: true,
      state: buildCompanyScopedState(user, access, activeCompany.id)
    });
  });
  router2.get("/erp/records/:collection", requireAuth, requireActiveCompany, (req, res) => {
    const col = req.params.collection;
    if (!(col in COLLECTION_MODULE_MAP)) {
      res.status(404).json({ error: "Unknown resource collection" });
      return;
    }
    const meta = COLLECTION_MODULE_MAP[col];
    if (!hasModule(req.activeAccess, req.user, meta.module) || !hasPerm(req.activeAccess, req.user, "view_transactions")) {
      res.status(403).json({ error: `Forbidden: Missing ${meta.module} view permission` });
      return;
    }
    const companyId = req.activeCompany.id;
    const items = db[col].filter((r) => r.companyId === companyId);
    res.json({ items });
  });
  router2.delete("/erp/records/:collection/:id", requireAuth, requireActiveCompany, (req, res) => {
    const col = req.params.collection;
    if (!(col in COLLECTION_MODULE_MAP)) {
      res.status(404).json({ error: "Unknown resource collection" });
      return;
    }
    const meta = COLLECTION_MODULE_MAP[col];
    if (!hasModule(req.activeAccess, req.user, meta.module) || !hasPerm(req.activeAccess, req.user, "delete_transactions")) {
      res.status(403).json({ error: "Forbidden: Missing delete_transactions permission" });
      return;
    }
    const companyId = req.activeCompany.id;
    const list = db[col];
    const ownMatch = list.find((r) => r.companyId === companyId && getItemKey(col, r) === req.params.id);
    const foreignMatch = !ownMatch ? list.find((r) => getItemKey(col, r) === req.params.id) : void 0;
    if (!ownMatch && !foreignMatch) {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    if (!ownMatch && foreignMatch) {
      appendAudit(req.user, req.activeCompany, "Cross-Company IDOR Blocked", meta.module, `Blocked DELETE on ${col}/${req.params.id} belonging to ${String(foreignMatch.companyId)}`, req.params.id);
      persistDatabase();
      res.status(403).json({ error: "Forbidden: Cross-company access blocked" });
      return;
    }
    db[col] = list.filter(
      (r) => !(r.companyId === companyId && getItemKey(col, r) === req.params.id)
    );
    appendAudit(req.user, req.activeCompany, `Deleted ${meta.label}`, meta.module, `Removed ${getReadableRef(ownMatch)}`, req.params.id);
    persistDatabase();
    res.json({ ok: true });
  });
  router2.post("/erp/commit", requireAuth, requireActiveCompany, (req, res) => {
    const user = req.user;
    const access = req.activeAccess;
    const company = req.activeCompany;
    const companyId = company.id;
    const incoming = req.body?.state;
    if (!incoming || typeof incoming !== "object") {
      res.status(400).json({ error: "Invalid state payload" });
      return;
    }
    const pendingAudits = [];
    if (Array.isArray(incoming.companies) && incoming.companies.length > 0) {
      const canManageComp = hasPerm(access, user, "manage_companies");
      const baselineCompanies = canManageComp ? db.companies : getAssignedCompanies(user);
      const prevMap = new Map(baselineCompanies.map((c) => [c.id, c]));
      const changed = incoming.companies.length !== baselineCompanies.length || incoming.companies.some((c) => JSON.stringify(c) !== JSON.stringify(prevMap.get(c.id)));
      if (changed) {
        if (!canManageComp) {
          res.status(403).json({ error: "Forbidden: Missing manage_companies permission." });
          return;
        }
        pendingAudits.push({
          action: "Updated Companies Configuration",
          module: "masterData",
          details: `Updated company registry (${incoming.companies.length} companies)`
        });
      }
    }
    let nextUsersMerged = null;
    if (Array.isArray(incoming.users) && incoming.users.length > 0) {
      const prevMap = new Map(db.users.map((u) => [u.id, u]));
      const prevSafeMap = new Map(db.users.map((u) => [u.id, sanitizeUser(u)]));
      const normalizedIncomingUsers = incoming.users.map((u) => {
        const existing = prevMap.get(u.id);
        const passwordHash = u.password && u.password !== "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" ? hashPassword(u.password) : existing?.passwordHash || hashPassword(u.username);
        return normalizeUserRecord({
          ...existing,
          ...u,
          passwordHash,
          password: void 0
        });
      });
      const changed = normalizedIncomingUsers.length !== db.users.length || normalizedIncomingUsers.some(
        (u) => JSON.stringify(sanitizeUser(u)) !== JSON.stringify(prevSafeMap.get(u.id))
      );
      if (changed) {
        if (!hasPerm(access, user, "manage_users")) {
          res.status(403).json({ error: "Forbidden: Missing manage_users permission." });
          return;
        }
        nextUsersMerged = normalizedIncomingUsers;
        pendingAudits.push({
          action: "Updated User RBAC Access",
          module: "masterData",
          details: `Modified user accounts & per-company permissions (${normalizedIncomingUsers.length} users)`
        });
      }
    }
    const scopedKeys = Object.keys(COLLECTION_MODULE_MAP);
    const stagedScoped = {};
    for (const col of scopedKeys) {
      const incomingList = incoming[col];
      if (!Array.isArray(incomingList)) continue;
      const meta = COLLECTION_MODULE_MAP[col];
      const dbAll = db[col];
      const dbCompanyItems = dbAll.filter((r) => r.companyId === companyId);
      const dbOtherItems = dbAll.filter((r) => r.companyId !== companyId);
      for (const item of incomingList) {
        if (item.companyId && item.companyId !== companyId) {
          appendAudit(user, company, "Cross-Company Injection Blocked", meta.module, `Attempted to write ${col} record with companyId=${String(item.companyId)}`);
          persistDatabase();
          res.status(403).json({ error: `Forbidden: Cross-company write blocked on ${col}` });
          return;
        }
        if (col !== "accounts") {
          const key = getItemKey(col, item);
          const foreignMatch = dbOtherItems.find((r) => getItemKey(col, r) === key);
          if (foreignMatch) {
            appendAudit(user, company, "Cross-Company IDOR Blocked", meta.module, `Attempted to overwrite foreign ${col} record ${key}`);
            persistDatabase();
            res.status(403).json({ error: `Forbidden: Record ${key} belongs to another company` });
            return;
          }
        }
      }
      const stampedList = incomingList.map((item) => ({ ...item, companyId }));
      const prevMap = new Map(dbCompanyItems.map((r) => [getItemKey(col, r), r]));
      const nextMap = new Map(stampedList.map((r) => [getItemKey(col, r), r]));
      for (const [key, prevItem] of prevMap.entries()) {
        if (!nextMap.has(key)) {
          if (!hasPerm(access, user, "delete_transactions") || col === "projects" && !isManagementUser(user, access)) {
            res.status(403).json({ error: `Forbidden: Missing delete_transactions permission to remove ${meta.label}` });
            return;
          }
          pendingAudits.push({
            action: `Deleted ${meta.label}`,
            module: meta.module,
            targetId: getReadableRef(prevItem),
            details: `Removed ${meta.label} ${getReadableRef(prevItem)}`
          });
        }
      }
      if (col === "projects") {
        const seenCodes = /* @__PURE__ */ new Set();
        for (const item of stampedList) {
          const code = String(item.code || "").trim().toLowerCase();
          if (code && seenCodes.has(code)) {
            res.status(409).json({ error: `Duplicate Project Code "${String(item.code)}" in ${company.code}.` });
            return;
          }
          if (code) seenCodes.add(code);
        }
      }
      for (const [key, nextItem] of nextMap.entries()) {
        if (!prevMap.has(key)) {
          const contextualAllowed = col === "projects" && isManagementUser(user, access) && (hasModule(access, user, "projects") || hasModule(access, user, "masterData")) || col === "suppliers" && (hasModule(access, user, "canvassing") || hasModule(access, user, "masterData")) || col === "materials" && (hasModule(access, user, "requisitions") || hasModule(access, user, "masterData")) || col === "journalEntries" && (hasModule(access, user, "accounting") || hasModule(access, user, "orders") || hasModule(access, user, "vouchers") || hasModule(access, user, "tools")) || col === "purchaseOrders" && (hasModule(access, user, "purchasing") || hasModule(access, user, "orders")) || col === "purchaseRequests" && (hasModule(access, user, "canvassing") || hasModule(access, user, "purchasing")) || col === "canvasses" && (hasModule(access, user, "requisitions") || hasModule(access, user, "canvassing")) || hasModule(access, user, meta.module);
          if (!contextualAllowed || !hasPerm(access, user, "create_transactions")) {
            res.status(403).json({ error: `Forbidden: Missing create_transactions permission for ${meta.label}` });
            return;
          }
          pendingAudits.push({
            action: `Created ${meta.label}`,
            module: meta.module,
            targetId: getReadableRef(nextItem),
            details: `Created ${meta.label} ${getReadableRef(nextItem)}`
          });
        } else {
          const prevItem = prevMap.get(key);
          if (JSON.stringify(prevItem) !== JSON.stringify(nextItem)) {
            const prevStatus = String(prevItem.status || "");
            const nextStatus = String(nextItem.status || "");
            const isRejectionTransition = prevStatus !== nextStatus && (col === "purchaseRequests" && nextStatus === "Rejected" || col === "vouchers" && nextStatus === "Cancelled" || col === "borrowRequests" && nextStatus === "Rejected");
            const isApprovalTransition = prevStatus !== nextStatus && (col === "purchaseRequests" && ["For Recommending Approval", "For Final Approval", "Approved"].includes(nextStatus) || col === "vouchers" && nextStatus === "Approved" || col === "borrowRequests" && nextStatus === "Approved");
            if (isRejectionTransition) {
              if (!hasPerm(access, user, "reject_transactions") && !hasPerm(access, user, "approve_transactions")) {
                res.status(403).json({ error: `Forbidden: Missing reject_transactions permission for ${meta.label}` });
                return;
              }
              pendingAudits.push({
                action: `${meta.label} ${nextStatus}`,
                module: meta.module,
                targetId: getReadableRef(nextItem),
                details: `Transitioned ${getReadableRef(nextItem)} from ${prevStatus} to ${nextStatus}`
              });
            } else if (isApprovalTransition) {
              if (!hasPerm(access, user, "approve_transactions")) {
                res.status(403).json({ error: `Forbidden: Missing approve_transactions permission for ${meta.label}` });
                return;
              }
              pendingAudits.push({
                action: `${meta.label} ${nextStatus}`,
                module: meta.module,
                targetId: getReadableRef(nextItem),
                details: `Transitioned ${getReadableRef(nextItem)} from ${prevStatus} to ${nextStatus}`
              });
            } else {
              const editContextualAllowed = col === "projects" && isManagementUser(user, access) && (hasModule(access, user, "projects") || hasModule(access, user, "masterData")) || col === "requisitions" && (hasModule(access, user, "requisitions") || hasModule(access, user, "canvassing")) || col === "canvasses" && hasModule(access, user, "canvassing") || col === "purchaseRequests" && hasModule(access, user, "purchasing") || col === "purchaseOrders" && hasModule(access, user, "orders") || col === "vouchers" && hasModule(access, user, "vouchers") || col === "tools" && hasModule(access, user, "tools") || col === "borrowRequests" && hasModule(access, user, "tools") || col === "employees" && hasModule(access, user, "masterData") || hasModule(access, user, meta.module);
              const hasActionPerm = hasPerm(access, user, "edit_transactions") || hasPerm(access, user, "create_transactions") || hasPerm(access, user, "process_transactions") || hasPerm(access, user, "submit_transactions");
              if (!editContextualAllowed || !hasActionPerm) {
                res.status(403).json({ error: `Forbidden: Missing edit/process permission for ${meta.label}` });
                return;
              }
              pendingAudits.push({
                action: `Updated ${meta.label}`,
                module: meta.module,
                targetId: getReadableRef(nextItem),
                details: prevStatus !== nextStatus ? `Updated ${getReadableRef(nextItem)} status (${prevStatus} \u2192 ${nextStatus})` : `Modified ${meta.label} ${getReadableRef(nextItem)}`
              });
            }
          }
        }
      }
      stagedScoped[col] = [...dbOtherItems, ...stampedList];
    }
    if (Array.isArray(incoming.companies) && hasPerm(access, user, "manage_companies")) {
      db.companies = incoming.companies;
    }
    if (nextUsersMerged) {
      db.users = nextUsersMerged;
    }
    for (const [col, merged] of Object.entries(stagedScoped)) {
      if (merged) {
        db[col] = merged;
      }
    }
    for (const a of pendingAudits) {
      appendAudit(user, company, a.action, a.module, a.details, a.targetId);
    }
    persistDatabase();
    const scoped = buildCompanyScopedState(user, access, companyId);
    res.json({ ok: true, state: scoped });
  });
  return router2;
}

// server/vercelEntry.ts
var app = (0, import_express2.default)();
var router = createErpBackendRouter();
app.use("/api", router);
app.use("/", router);
app.use((err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  if (!res.headersSent) {
    res.status(500).json({ error: message });
  }
});
var vercelEntry_default = app;
