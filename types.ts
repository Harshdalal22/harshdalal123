export interface PartyDetails {
    name: string;
    address: string;
    city: string;
    contact: string;
    pan: string;
    gst: string;
}

export interface Item {
    description: string;
    pcs: number;
    weight: number;
}

export interface BankDetails {
    name: string;
    branch: string;
    accountNo: string;
    ifscCode: string;
}

export interface DetailedCharges {
    hamail: number;
    surCharge: number;
    stCharge: number;
    collectionCharge: number;
    ddCharge: number;
    otherCharge: number;
    riskCharge: number;
}

export interface LorryReceipt {
    lrType: 'Original' | 'Dummy';
    truckNo: string;
    lrNo: string;
    date: string;
    fromPlace: string;
    toPlace: string;

    invoiceNo: string;
    invoiceAmount: number;
    invoiceDate: string;
    poNo: string;
    poDate: string;

    ewayBillNo: string;
    ewayBillDate: string;
    ewayExDate: string;
    
    addressOfDelivery: string;
    chargedWeight: number;

    billingTo: PartyDetails;
    gstPaidBy: string;

    consignor: PartyDetails;
    consignee: PartyDetails;

    items: Item[];

    weight: number;
    actualWeightMT: number;

    freight: number;
    charges: DetailedCharges;
    rate: number;
    rateOn: string;

    remark: string;

    // Added for list view consistency
    createdBy?: string;
}

export interface CompanyDetails {
    name: string;
    logoUrl: string;
    signatureImageUrl: string;
    tagline: string;
    address: string;
    email: string;
    web: string;
    contact: string[];
    pan: string;
    gstn: string;
    bankDetails: BankDetails;
}