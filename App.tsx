import React, { useState, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { LorryReceipt, CompanyDetails } from './types';
import LRForm from './components/LRForm';
import LRList from './components/LRList';
import Header from './components/Header';

// Sample data that matches the new, detailed LorryReceipt structure
const initialLorryReceipts: LorryReceipt[] = [
    {
        lrNo: 'DEL/22553', date: '2025-07-28', truckNo: 'HR 65E 4180', fromPlace: 'BARMANA', toPlace: 'KARNAL',
        consignor: { name: 'FALKON PREFAB', address: 'Baddi, HP', city: 'Baddi', contact: '', pan: '', gst: 'GSTIN12345' },
        consignee: { name: 'FALKON PREFAB', address: 'Karnal, HR', city: 'Karnal', contact: '', pan: '', gst: 'GSTIN67890' },
        billingTo: { name: 'FALKON PREFAB', address: 'Baddi, HP', city: 'Baddi', contact: '', pan: '', gst: '' },
        items: [{ description: 'Building Material', pcs: 1, weight: 100 }],
        freight: 900.00,
        charges: { hamail: 0, surCharge: 0, stCharge: 0, collectionCharge: 0, ddCharge: 0, otherCharge: 0, riskCharge: 0 },
        createdBy: 'SSK',
        weight: 100,
        lrType: 'Original', invoiceNo: 'INV-001', invoiceAmount: 900, invoiceDate: '2025-07-28', poNo: '', poDate: '',
        ewayBillNo: '', ewayBillDate: '', ewayExDate: '',
        addressOfDelivery: 'Karnal Site', chargedWeight: 100,
        gstPaidBy: 'Consignor',
        actualWeightMT: 100, rate: 9, rateOn: 'Ton', remark: 'Handle with care'
    },
    {
        lrNo: 'DEL/1023', date: '2025-10-08', truckNo: 'HR 65D 4473', fromPlace: 'BERI', toPlace: 'DELHI',
        consignor: { name: 'MG EMBALLAGE PVT LTD', address: 'Beri, HR', city: 'Beri', contact: '', pan: '', gst: 'GSTINABCDE' },
        consignee: { name: 'AAKASH TRADERS', address: 'Delhi', city: 'Delhi', contact: '', pan: '', gst: 'GSTINFGHIJ' },
        billingTo: { name: 'MG EMBALLAGE PVT LTD', address: 'Beri, HR', city: 'Beri', contact: '', pan: '', gst: '' },
        items: [{ description: 'Packaging Material', pcs: 1, weight: 5 }],
        freight: 7000.00,
        charges: { hamail: 0, surCharge: 0, stCharge: 0, collectionCharge: 0, ddCharge: 0, otherCharge: 0, riskCharge: 0 },
        createdBy: 'SSK',
        weight: 5,
        lrType: 'Original', invoiceNo: 'INV-002', invoiceAmount: 7000, invoiceDate: '2025-10-08', poNo: '', poDate: '',
        ewayBillNo: '', ewayBillDate: '', ewayExDate: '',
        addressOfDelivery: 'Delhi Warehouse', chargedWeight: 5,
        gstPaidBy: 'Consignor',
        actualWeightMT: 5, rate: 1400, rateOn: 'Trip', remark: ''
    }
];


const App: React.FC = () => {
    const [lorryReceipts, setLorryReceipts] = useState<LorryReceipt[]>(initialLorryReceipts);
    const [editingLR, setEditingLR] = useState<LorryReceipt | null>(null);
    const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
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
    });
    const [currentView, setCurrentView] = useState<'list' | 'form'>('list');

    const handleSaveLR = (lr: LorryReceipt) => {
        if (editingLR) {
            setLorryReceipts(lorryReceipts.map(r => r.lrNo === lr.lrNo ? lr : r));
            toast.success('LR updated successfully!');
        } else {
            setLorryReceipts([lr, ...lorryReceipts]);
            toast.success('LR generated successfully!');
        }
        setEditingLR(null);
    };

    const handleAddNew = () => {
        setEditingLR(null);
        setCurrentView('form');
    };

    const handleEditLR = (lrNo: string) => {
        const lrToEdit = lorryReceipts.find(lr => lr.lrNo === lrNo);
        if (lrToEdit) {
            setEditingLR(lrToEdit);
            setCurrentView('form');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDeleteLR = (lrNo: string) => {
        if (window.confirm('Are you sure you want to delete this LR?')) {
            setLorryReceipts(lorryReceipts.filter(lr => lr.lrNo !== lrNo));
            toast.success('LR deleted successfully!');
        }
    };

    const handleCancelForm = () => {
        setEditingLR(null);
        setCurrentView('list');
    };

    return (
        <div className="bg-slate-100 min-h-screen font-sans">
            <Toaster position="top-center" />
            <Header 
                companyDetails={companyDetails} 
                setCompanyDetails={setCompanyDetails}
            />
            <main className="container mx-auto p-4 md:p-8">
                {currentView === 'list' ? (
                    <LRList 
                        lorryReceipts={lorryReceipts}
                        onEdit={handleEditLR}
                        onDelete={handleDeleteLR}
                        companyDetails={companyDetails}
                        onAddNew={handleAddNew}
                    />
                ) : (
                    <LRForm 
                        onSave={handleSaveLR}
                        existingLR={editingLR}
                        onCancel={handleCancelForm}
                        companyDetails={companyDetails}
                        lorryReceipts={lorryReceipts}
                    />
                )}
            </main>
        </div>
    );
};

export default App;