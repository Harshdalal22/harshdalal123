import React, { useState, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { LorryReceipt, CompanyDetails } from './types';
import LRForm from './components/LRForm';
import LRList from './components/LRList';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import { 
    getLorryReceipts, 
    saveLorryReceipt, 
    deleteLorryReceipt, 
    getCompanyDetails, 
    saveCompanyDetails 
} from './services/supabaseService';

// Default details to use if nothing is in the database yet
const defaultCompanyDetails: CompanyDetails = {
    name: 'SSK CARGO SERVICES PVT LTD',
    logoUrl: 'https://i.imgur.com/Jkvt1tM.png',
    signatureImageUrl: 'https://i.imgur.com/jfn26fD.png',
    tagline: '',
    address: 'Shop No-37, New Anaj Mandi, Sampla, Rohta-124501',
    email: 'sskcargoservices@gmail.com',
    web: '',
    contact: ['7834819005', '8929920007'],
    pan: 'ABQCS8517E',
    gstn: '06ABQCS8517E1Z0',
    bankDetails: {
        name: 'SBI BANK',
        branch: 'MDU ROHTAK, HARYANA',
        accountNo: '44387051887',
        ifscCode: 'SBIN0004734'
    }
};


const App: React.FC = () => {
    const [lorryReceipts, setLorryReceipts] = useState<LorryReceipt[]>([]);
    const [editingLR, setEditingLR] = useState<LorryReceipt | null>(null);
    const [companyDetails, setCompanyDetails] = useState<CompanyDetails>(defaultCompanyDetails);
    const [currentView, setCurrentView] = useState<'dashboard' | 'list' | 'form'>('dashboard');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [lrs, details] = await Promise.all([
                    getLorryReceipts(),
                    getCompanyDetails(defaultCompanyDetails)
                ]);
                setLorryReceipts(lrs);
                setCompanyDetails(details);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                console.error("Failed to fetch initial data:", error);
                toast.error(
                    `Failed to load data: ${errorMessage}. Please check your Supabase configuration and network connection.`, 
                    { duration: 8000 }
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSaveLR = async (lr: LorryReceipt) => {
        const toastId = toast.loading(editingLR ? 'Updating LR...' : 'Saving LR...');
        try {
            // Sanitize the LR data before sending it to the database
            const lrToSave = {
                ...lr,
                invoiceDate: lr.invoiceDate || null,
                poDate: lr.poDate || null,
                ewayBillDate: lr.ewayBillDate || null,
                ewayExDate: lr.ewayExDate || null,
            };

            const savedLr = await saveLorryReceipt(lrToSave);
            if (editingLR) {
                setLorryReceipts(lorryReceipts.map(r => r.lrNo === savedLr.lrNo ? savedLr : r));
                toast.success('LR updated successfully!');
            } else {
                setLorryReceipts([savedLr, ...lorryReceipts]);
                toast.success('LR generated successfully!');
            }
            setEditingLR(null);
            setCurrentView('list');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error("Failed to save LR:", error);
            toast.error(`Failed to save LR: ${errorMessage}`);
        } finally {
            toast.dismiss(toastId);
        }
    };

    const handleAddNew = () => {
        setEditingLR(null);
        setCurrentView('form');
    };

    const handleViewList = () => {
        setCurrentView('list');
    }

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
    }

    const handleEditLR = (lrNo: string) => {
        const lrToEdit = lorryReceipts.find(lr => lr.lrNo === lrNo);
        if (lrToEdit) {
            setEditingLR(lrToEdit);
            setCurrentView('form');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDeleteLR = async (lrNo: string) => {
        if (window.confirm('Are you sure you want to delete this LR? This action cannot be undone.')) {
            const toastId = toast.loading('Deleting LR...');
            try {
                await deleteLorryReceipt(lrNo);
                setLorryReceipts(lorryReceipts.filter(lr => lr.lrNo !== lrNo));
                toast.success('LR deleted successfully!');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
                console.error("Failed to delete LR:", error);
                toast.error(`Failed to delete LR: ${errorMessage}`);
            } finally {
                toast.dismiss(toastId);
            }
        }
    };

    const handleCancelForm = () => {
        setEditingLR(null);
        setCurrentView('list');
    };
    
    const handleUpdateCompanyDetails = async (details: CompanyDetails): Promise<boolean> => {
        const toastId = toast.loading('Saving settings...');
        try {
            const savedDetails = await saveCompanyDetails(details);
            setCompanyDetails(savedDetails);
            toast.success('Settings saved successfully!');
            return true; // Indicate success
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error("Failed to save settings:", error);
            toast.error(`Failed to save settings: ${errorMessage}`);
            return false; // Indicate failure
        } finally {
            toast.dismiss(toastId);
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                    <Dashboard 
                        lorryReceipts={lorryReceipts}
                        onAddNew={handleAddNew}
                        onViewList={handleViewList}
                        onEditLR={handleEditLR}
                    />
                );
            case 'list':
                return (
                    <LRList 
                        lorryReceipts={lorryReceipts}
                        onEdit={handleEditLR}
                        onDelete={handleDeleteLR}
                        companyDetails={companyDetails}
                        onAddNew={handleAddNew}
                        onBackToDashboard={handleBackToDashboard}
                    />
                );
            case 'form':
                return (
                     <LRForm 
                        onSave={handleSaveLR}
                        existingLR={editingLR}
                        onCancel={handleCancelForm}
                        companyDetails={companyDetails}
                        lorryReceipts={lorryReceipts}
                    />
                );
            default:
                return null;
        }
    }


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-gray-200">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-ssk-blue mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-lg font-semibold text-gray-700">Loading Data...</p>
                    <p className="mt-2 text-sm text-gray-500">Connecting to database. If this takes too long, check your Supabase configuration.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-50 to-gray-200 min-h-screen font-sans">
            <Toaster position="top-center" />
            <Header 
                companyDetails={companyDetails} 
                setCompanyDetails={handleUpdateCompanyDetails}
            />
            <main className="container mx-auto p-4 md:p-6">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;