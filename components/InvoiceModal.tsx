import React, { useRef, forwardRef } from 'react';
import { LorryReceipt, CompanyDetails, PartyDetails } from '../types';
import { DownloadIcon, XIcon } from './icons';
import { toWords } from '../utils/numberToWords';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    lorryReceipts: LorryReceipt[];
    companyDetails: CompanyDetails;
}

declare const html2pdf: any;

const InvoiceContent = forwardRef<HTMLDivElement, { lorryReceipts: LorryReceipt[], companyDetails: CompanyDetails }>(({ lorryReceipts, companyDetails }, ref) => {
    const totalAmount = lorryReceipts.reduce((sum, lr) => {
        // FIX: Cast charge to number before adding, as Object.values can return unknown type.
        const totalCharges = Object.values(lr.charges || {}).reduce((chargeSum, charge) => chargeSum + (Number(charge) || 0), 0);
        return sum + (Number(lr.freight) || 0) + totalCharges;
    }, 0);
    const totalCgst = totalAmount * 0.025; // Calculate CGST on the total amount
    const totalSgst = totalAmount * 0.025; // Calculate SGST on the total amount
    const totalIgst = 0; // Assuming IGST is always 0 for now
    const netAmount = totalAmount + totalCgst + totalSgst + totalIgst;
    const amountInWords = toWords(Math.round(netAmount));

    const billedTo: Partial<PartyDetails> = lorryReceipts.length > 0 ? (lorryReceipts[0].billingTo?.name ? lorryReceipts[0].billingTo : lorryReceipts[0].consignor) : { name: 'N/A', address: 'N/A', gst: 'N/A' };
    
    const billNo = `000${(lorryReceipts.map(lr => lr.lrNo).join('').length % 90) + 1}`.slice(-4);
    const billDate = new Date().toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'});


    return (
        <div ref={ref} className="printable-area p-4 bg-white text-black font-['Calibri',sans-serif] w-[710px] lg:w-full mx-auto border-2 border-black text-sm">
            {/* Header */}
            <div className="text-center text-black">
                <p className="font-bold">JAI DADA UDMI RAM</p>
                <p className="text-xs">SUBJECT TO HARYANA JURISDICTION</p>
            </div>
            
            <div className="flex justify-between items-center mt-1 pb-2 border-b-2 border-black">
                <div className="w-1/4 flex justify-start">
                     {companyDetails.logoUrl ? 
                        <img src={companyDetails.logoUrl} alt="Company Logo" className="h-16 w-auto object-contain" /> :
                        <div className="h-16 w-32 border bg-gray-200 flex items-center justify-center text-xs text-center">No Logo</div>
                    }
                </div>
                <div className="w-1/2 text-center text-black">
                    <h1 className="text-3xl font-bold text-red-600">SSK CARGO SERVICES Pvt. Ltd.</h1>
                    <p className="font-bold text-base">(Fleet Owner & Contractor)</p>
                    <p className="text-xs mt-1">{companyDetails.address}</p>
                    <p className="text-xs">
                        Mail-{companyDetails.email}, Web-
                    </p>
                </div>
                <div className="w-1/4 text-right font-bold text-xs text-black">
                    {companyDetails.contact.map(c => <p key={c}>{c}</p>)}
                </div>
            </div>

            <div className="flex justify-between items-start mt-2 text-black">
                <div className="w-2/3">
                    <p className="font-bold">M/S :</p>
                    <p className="font-bold">{billedTo.name}</p>
                    <p>{billedTo.address}</p>
                </div>
                <div className="w-1/3 text-left pl-10">
                    <p className="font-bold">BILL NO. : {billNo}</p>
                    <p className="font-bold">DATE : {billDate}</p>
                </div>
            </div>
            <p className="font-bold text-black mt-2">GST :- {billedTo.gst}</p>

            {/* Table */}
            <table className="w-full border-collapse border-2 border-black mt-2 text-xs text-black">
                <thead className="font-bold text-center">
                    <tr>
                        <th className="border-2 border-black p-1 w-[5%]">Sr.No</th>
                        <th className="border-2 border-black p-1 w-[10%]">Date</th>
                        <th className="border-2 border-black p-1 w-[12%]">Truck</th>
                        <th className="border-2 border-black p-1 w-[12%]">LR No.</th>
                        <th className="border-2 border-black p-1">From</th>
                        <th className="border-2 border-black p-1">To</th>
                        <th className="border-2 border-black p-1 w-[10%]">Freight</th>
                        <th className="border-2 border-black p-1 w-[10%]">Other Charges</th>
                        <th className="border-2 border-black p-1 w-[10%]">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {lorryReceipts.map((lr, index) => {
                        // FIX: Cast charge to number before adding, as Object.values can return unknown type.
                        const totalCharges = Object.values(lr.charges || {}).reduce((chargeSum, charge) => chargeSum + (Number(charge) || 0), 0);
                        return (
                            <tr key={lr.lrNo} style={{ height: '24px' }}>
                                <td className="border-2 border-black p-1 text-center">{index + 1}</td>
                                <td className="border-2 border-black p-1 text-center">{new Date(lr.date).toLocaleDateString('en-GB')}</td>
                                <td className="border-2 border-black p-1">{lr.truckNo}</td>
                                <td className="border-2 border-black p-1 text-center">{lr.lrNo}</td>
                                <td className="border-2 border-black p-1">{lr.fromPlace}</td>
                                <td className="border-2 border-black p-1">{lr.toPlace}</td>
                                {/* FIX: Cast lr.freight to Number to use .toFixed() and perform addition, preventing type errors. */}
                                <td className="border-2 border-black p-1 text-right">{Number(lr.freight).toFixed(2)}</td>
                                <td className="border-2 border-black p-1 text-right">{totalCharges.toFixed(2)}</td>
                                <td className="border-2 border-black p-1 text-right">{(Number(lr.freight) + totalCharges).toFixed(2)}</td>
                            </tr>
                        );
                    })}
                    {Array.from({ length: Math.max(0, 15 - lorryReceipts.length) }).map((_, i) => (
                        <tr key={`empty-${i}`} style={{ height: '24px' }}>
                            {Array.from({ length: 9 }).map((_, j) => <td key={j} className="border-2 border-black"></td>)}
                        </tr>
                    ))}
                </tbody>
                <tfoot className="text-black font-bold text-xs">
                    <tr>
                        <td colSpan={6} className="border-2 border-black p-1 align-top">
                            <p>GSTIN : {companyDetails.gstn}</p>
                            <p className="mt-1">PAN No. : {companyDetails.pan}</p>
                            <div className="mt-2">
                                <p>BANK DETAILS</p>
                                <p>BANK NAME : {companyDetails.bankDetails.name}</p>
                                <p>BRANCH : {companyDetails.bankDetails.branch}</p>
                                <p>A/C NO. : {companyDetails.bankDetails.accountNo}</p>
                                <p>IFSCCODE : {companyDetails.bankDetails.ifscCode}</p>
                            </div>
                        </td>
                        <td colSpan={3} className="border-2 border-black p-0 align-top">
                            <table className="w-full text-xs font-bold">
                                <tbody>
                                    <tr>
                                        <td className="border-b-2 border-black p-1 bg-black text-white">AMOUNT</td>
                                        <td className="border-b-2 border-black p-1 text-right bg-black text-white">{totalAmount.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border-b-2 border-black p-1 bg-black text-white">CGST</td>
                                        <td className="border-b-2 border-black p-1 text-right bg-black text-white">{totalCgst.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border-b-2 border-black p-1 bg-black text-white">SGST</td>
                                        <td className="border-b-2 border-black p-1 text-right bg-black text-white">{totalSgst.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-1 h-[60px] align-top bg-black text-white">IGST</td>
                                        <td className="p-1 text-right align-top bg-black text-white">{totalIgst.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={6} className="border-x-2 border-b-2 border-black p-1 align-bottom">
                             <p>Rupees(word): {amountInWords} Rupees</p>
                        </td>
                        <td colSpan={3} className="border-x-2 border-b-2 border-black p-0">
                             <div className="border-t-2 border-black py-1 px-1 flex justify-between bg-black text-white font-bold">
                                <span>NET AMOUNT</span>
                                <span>{netAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                             </div>
                        </td>
                    </tr>
                     <tr>
                        <td colSpan={9} className="p-1 align-bottom text-right h-[100px]">
                            <div className="inline-block text-center">
                                {companyDetails.signatureImageUrl && (
                                    <img src={companyDetails.signatureImageUrl} alt="Signature" className="h-16 object-contain mx-auto" />
                                 )}
                                <p className="font-bold mt-1">Authorized Signatory</p>
                                <p className="font-bold">SSK CARGO SERVICES PVT. LTD.</p>
                                <p className="font-bold">DIRECTOR</p>
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
});

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, lorryReceipts, companyDetails }) => {
    const previewRef = useRef<HTMLDivElement>(null);
    if (!isOpen) return null;

    const handleDownloadPDF = () => {
        const element = previewRef.current;
        if (!element) return;
        
        const billedTo = lorryReceipts.length > 0 ? (lorryReceipts[0].billingTo?.name ? lorryReceipts[0].billingTo : lorryReceipts[0].consignor) : { name: 'bill' };
        
        const opt = {
            margin:       10, // 10mm margin on all sides
            filename:     `Bill-${billedTo.name?.split(' ')[0]}-${new Date().toISOString().split('T')[0]}.pdf`,
            image:        { type: 'jpeg', quality: 1.0 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-start p-2 sm:p-4 overflow-auto">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl my-8">
                <div className="p-4 bg-gray-100 rounded-t-lg flex flex-wrap justify-between items-center gap-2 sticky top-0 z-10">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">Invoice Preview</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleDownloadPDF} className="flex items-center bg-ssk-red text-white px-3 py-2 rounded-md hover:bg-red-700 font-semibold">
                            <DownloadIcon className="w-5 h-5 mr-1"/>Download PDF
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-300">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
                <div className="p-2 sm:p-4 overflow-x-auto">
                    <InvoiceContent ref={previewRef} lorryReceipts={lorryReceipts} companyDetails={companyDetails} />
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;