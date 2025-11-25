import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';
import { LorryReceipt, CompanyDetails, LRStatus } from '../types';

const supabaseUrl = 'https://avqevimedgoogcupnojo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2cWV2aW1lZGdvb2djdXBub2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjU0MzksImV4cCI6MjA3OTUwMTQzOX0.SWBCoebfu_yHUk6fGFpiy5ZMzbkZeot5jYjaAjF0esM';

let supabase: SupabaseClient | null = null;

const getSupabase = (): SupabaseClient => {
    if (!supabase) {
        try {
            supabase = createClient(supabaseUrl, supabaseAnonKey);
        } catch (error) {
            console.error("Error creating Supabase client:", error);
            // This error will be caught by the calling function's try-catch block
            throw new Error("Invalid Supabase credentials provided.");
        }
    }
    return supabase;
};

// --- Authentication Functions ---

export const signUp = async (email: string, password: string) => {
    const client = getSupabase();
    const { error } = await client.auth.signUp({ email, password });
    if (error) throw error;
};

export const signIn = async (email: string, password: string) => {
    const client = getSupabase();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
};

export const signOut = async () => {
    const client = getSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw error;
};

// FIX: Removed the unused 'password' parameter. The resetPasswordForEmail function only requires the email.
export const sendPasswordReset = async (email: string) => {
    const client = getSupabase();
    const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Or a specific password reset page
    });
    if (error) throw error;
}

export const getSession = async (): Promise<Session | null> => {
    const client = getSupabase();
    const { data: { session } } = await client.auth.getSession();
    return session;
};

export const subscribeToAuthState = (callback: (event: string, session: Session | null) => void) => {
    const client = getSupabase();
    return client.auth.onAuthStateChange(callback);
};

// --- Helper function to get the current user ---
const getCurrentUser = async () => {
    const session = await getSession();
    if (!session?.user) {
        throw new Error('User not authenticated.');
    }
    return session.user;
};

// --- Lorry Receipt Functions (User-Aware) ---

export const getLorryReceipts = async (): Promise<LorryReceipt[]> => {
    const user = await getCurrentUser();
    const client = getSupabase();
    const { data, error } = await client
        .from('lorry_receipts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching lorry receipts:', error.message, { details: error });
        throw error;
    }
    return data || [];
};

export const saveLorryReceipt = async (lr: LorryReceipt): Promise<LorryReceipt> => {
    const user = await getCurrentUser();
    const client = getSupabase();
    const lrWithUser = { ...lr, user_id: user.id };
    
    const { data, error } = await client
        .from('lorry_receipts')
        .upsert(lrWithUser, { onConflict: 'lrNo' })
        .select()
        .single();
    
    if (error) {
        console.error('Error saving lorry receipt:', error.message, { details: error });
        throw error;
    }
    return data;
};

export const updateLorryReceiptStatus = async (lrNo: string, status: LRStatus): Promise<LorryReceipt> => {
    const user = await getCurrentUser();
    const client = getSupabase();
    const { data, error } = await client
        .from('lorry_receipts')
        .update({ status: status, status_updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('lrNo', lrNo)
        .select()
        .single();
        
    if (error) {
        console.error('Error updating LR status:', error.message, { details: error });
        throw error;
    }
    return data;
};


export const deleteLorryReceipt = async (lrNo: string): Promise<void> => {
    const user = await getCurrentUser();
    const client = getSupabase();
    const { error } = await client
        .from('lorry_receipts')
        .delete()
        .eq('user_id', user.id)
        .eq('lrNo', lrNo);

    if (error) {
        console.error('Error deleting lorry receipt:', error.message, { details: error });
        throw error;
    }
};

export const getRecentLorryReceiptsForAI = async (limit: number = 10): Promise<Partial<LorryReceipt>[]> => {
    const user = await getCurrentUser();
    const client = getSupabase();
    const { data, error } = await client
        .from('lorry_receipts')
        .select('lrNo, truckNo, fromPlace, toPlace, consignor, consignee, invoiceNo, remark')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent lorry receipts for AI:', error.message, { details: error });
        throw error;
    }
    return (data || []).map((lr): Partial<LorryReceipt> => ({
        ...lr,
        consignor: {
            name: lr.consignor.name, address: lr.consignor.address, city: '', contact: '', pan: '', gst: '',
        },
        consignee: {
            name: lr.consignee.name, address: lr.consignee.address, city: '', contact: '', pan: '', gst: '',
        },
    }));
};

// --- Company Details Functions (User-Aware) ---

export const getCompanyDetails = async (defaultDetails: CompanyDetails): Promise<CompanyDetails> => {
    const user = await getCurrentUser();
    const client = getSupabase();
    const { data, error } = await client
        .from('company_details')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "The result contains 0 rows"
        console.error('Error fetching company details:', error.message, { details: error });
        throw error;
    }
    
    if (!data) {
        return { ...defaultDetails, user_id: user.id };
    }

    const { user_id, ...companyDetails } = data;
    return companyDetails as CompanyDetails;
};

export const saveCompanyDetails = async (details: CompanyDetails): Promise<CompanyDetails> => {
    const user = await getCurrentUser();
    const client = getSupabase();
    const detailsWithUser = { ...details, user_id: user.id };

    const { data, error } = await client
        .from('company_details')
        .upsert(detailsWithUser, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) {
        console.error('Error saving company details:', error.message, { details: error });
        throw error;
    }
    
    const { user_id, ...companyDetails } = data;
    return companyDetails as CompanyDetails;
};

// --- POD (Proof of Delivery) Functions ---
const POD_BUCKET = 'pods';

export const uploadPOD = async (file: File, lrNo: string): Promise<LorryReceipt> => {
    const user = await getCurrentUser();
    const client = getSupabase();

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${lrNo}-${Date.now()}.${fileExt}`;

    // Upload the file to storage
    const { error: uploadError } = await client.storage
        .from(POD_BUCKET)
        .upload(filePath, file, { upsert: true }); // upsert allows overwriting

    if (uploadError) {
        console.error('Error uploading POD file:', uploadError);
        throw uploadError;
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = client.storage
        .from(POD_BUCKET)
        .getPublicUrl(filePath);

    if (!publicUrl) {
        throw new Error('Could not get public URL for the uploaded file.');
    }

    // Update the lorry_receipts table with the new URL
    const { data, error: dbError } = await client
        .from('lorry_receipts')
        .update({ pod_url: publicUrl })
        .eq('user_id', user.id)
        .eq('lrNo', lrNo)
        .select()
        .single();
    
    if (dbError) {
        console.error('Error updating LR with POD URL:', dbError);
        // Attempt to clean up the uploaded file if the DB update fails
        await client.storage.from(POD_BUCKET).remove([filePath]);
        throw dbError;
    }

    return data;
};

export const deletePOD = async (lr: LorryReceipt): Promise<LorryReceipt> => {
    if (!lr.pod_url) return lr;

    const user = await getCurrentUser();
    const client = getSupabase();
    
    // Extract file path from URL
    const url = new URL(lr.pod_url);
    const filePath = decodeURIComponent(url.pathname.substring(url.pathname.indexOf(POD_BUCKET) + POD_BUCKET.length + 1));
    
    // Remove the file from storage
    const { error: storageError } = await client.storage
        .from(POD_BUCKET)
        .remove([filePath]);
    
    if (storageError) {
        console.error('Error deleting POD file from storage:', storageError);
        throw storageError;
    }

    // Remove the URL from the lorry_receipts table
    const { data, error: dbError } = await client
        .from('lorry_receipts')
        .update({ pod_url: null })
        .eq('user_id', user.id)
        .eq('lrNo', lr.lrNo)
        .select()
        .single();
        
    if (dbError) {
        console.error('Error removing POD URL from LR:', dbError);
        throw dbError;
    }

    return data;
};

// --- Company Asset Functions ---
const ASSET_BUCKET = 'company-assets';

export const uploadCompanyAsset = async (file: File, assetType: 'logo' | 'signature'): Promise<string> => {
    const user = await getCurrentUser();
    const client = getSupabase();

    const fileExt = file.name.split('.').pop();
    // Use a fixed name for the asset to ensure overwriting, simplifying asset management.
    const filePath = `${user.id}/${assetType}.${fileExt}`;

    const { error: uploadError } = await client.storage
        .from(ASSET_BUCKET)
        .upload(filePath, file, { upsert: true }); // upsert allows overwriting existing file

    if (uploadError) {
        console.error(`Error uploading ${assetType}:`, uploadError);
        throw uploadError;
    }
    
    // The public URL needs a timestamp to bypass caching when the image is updated.
    const { data: { publicUrl } } = client.storage
        .from(ASSET_BUCKET)
        .getPublicUrl(`${filePath}?t=${new Date().getTime()}`);
        
    if (!publicUrl) {
        throw new Error(`Could not get public URL for the uploaded ${assetType}.`);
    }

    return publicUrl;
};