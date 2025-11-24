import { createClient } from '@supabase/supabase-js';
import { LorryReceipt, CompanyDetails } from '../types';

// --- Supabase Client Initialization ---
// The URL and anon key have been configured.
const supabaseUrl = 'https://avqevimedgoogcupnojo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2cWV2aW1lZGdvb2djdXBub2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjU0MzksImV4cCI6MjA3OTUwMTQzOX0.SWBCoebfu_yHUk6fGFpiy5ZMzbkZeot5jYjaAjF0esM';

// Initialize the Supabase client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Lorry Receipt Functions ---

export const getLorryReceipts = async (): Promise<LorryReceipt[]> => {
    const { data, error } = await supabase
        .from('lorry_receipts')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching lorry receipts:', error.message, { details: error });
        throw error;
    }
    return data || [];
};

export const saveLorryReceipt = async (lr: LorryReceipt): Promise<LorryReceipt> => {
    const { data, error } = await supabase
        .from('lorry_receipts')
        .upsert(lr, { onConflict: 'lrNo' })
        .select()
        .single();
    
    if (error) {
        console.error('Error saving lorry receipt:', error.message, { details: error });
        throw error;
    }
    return data;
};

export const deleteLorryReceipt = async (lrNo: string): Promise<void> => {
    const { error } = await supabase
        .from('lorry_receipts')
        .delete()
        .eq('lrNo', lrNo);

    if (error) {
        console.error('Error deleting lorry receipt:', error.message, { details: error });
        throw error;
    }
};

export const getRecentLorryReceiptsForAI = async (limit: number = 10): Promise<Partial<LorryReceipt>[]> => {
    // Selects only the fields needed for the AI prompt to be efficient
    const { data, error } = await supabase
        .from('lorry_receipts')
        .select('lrNo, truckNo, fromPlace, toPlace, consignor, consignee, invoiceNo, remark')
        .order('date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent lorry receipts for AI:', error.message, { details: error });
        throw error;
    }
    // The raw consignor/consignee objects are big, so we'll map them to a simpler structure for the prompt
    // FIX: The original mapping created an object incompatible with the PartyDetails type.
    // This is now fixed by creating a valid PartyDetails object with empty strings for missing fields,
    // which satisfies the type requirements.
    return (data || []).map((lr): Partial<LorryReceipt> => ({
        ...lr,
        consignor: {
            name: lr.consignor.name,
            address: lr.consignor.address,
            city: '',
            contact: '',
            pan: '',
            gst: '',
        },
        consignee: {
            name: lr.consignee.name,
            address: lr.consignee.address,
            city: '',
            contact: '',
            pan: '',
            gst: '',
        },
    }));
};

// --- Company Details Functions ---

// Company details are stored in a table with a single row, identified by this ID.
const COMPANY_DETAILS_ID = 1;

export const getCompanyDetails = async (defaultDetails: CompanyDetails): Promise<CompanyDetails> => {
    const { data, error } = await supabase
        .from('company_details')
        .select('*')
        .eq('id', COMPANY_DETAILS_ID)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
        console.error('Error fetching company details:', error.message, { details: error });
        throw error;
    }
    
    // If no details are found in the database, return the hardcoded default.
    if (!data) {
        return defaultDetails;
    }

    // The row from DB will have an `id` field which is not in CompanyDetails type, so we remove it.
    const { id, ...companyDetails } = data;
    return companyDetails as CompanyDetails;
};

export const saveCompanyDetails = async (details: CompanyDetails): Promise<CompanyDetails> => {
    const { data, error } = await supabase
        .from('company_details')
        .upsert({ id: COMPANY_DETAILS_ID, ...details }, { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        console.error('Error saving company details:', error.message, { details: error });
        throw error;
    }
    
    const { id, ...companyDetails } = data;
    return companyDetails as CompanyDetails;
};
