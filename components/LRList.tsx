import React, { useState } from 'react';
import { LorryReceipt, CompanyDetails } from '../types';
import { PencilIcon, TrashIcon, DownloadIcon } from './icons';
import LRPreviewModal from './LRPreviewModal';
import InvoiceModal from './InvoiceModal';

interface LRListProps {
    lorryReceipts: LorryReceipt[];
    onEdit: (lrNo: string) => void;
    onDelete: (lrNo: string) => void;
    onAddNew: () => void;
    companyDetails: CompanyDetails;
}

const LRList: React.FC<LRListProps> = ({ lorryReceipts, onEdit, onDelete, onAddNew, companyDetails }) => {
    const [previewingLR, setPreviewingLR] = useState<LorryReceipt | null>(null);
    const [selectedLRs, setSelectedLRs] = useState<string[]>([]);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    const handleSelectLR = (lrNo: string) => {
        setSelectedLRs(prev =>
            prev.includes(lrNo)
                ? prev.filter(no => no !== lrNo)
                : [...prev, lrNo]
        );
    };

    const lrsForInvoice = lorryReceipts.filter(lr => selectedLRs.includes(lr.lrNo));

    return (
        <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-ssk-blue self-start sm:self-center">View LR Details</h2>
                 <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => setIsInvoiceModalOpen(true)}
                        disabled={selectedLRs.length === 0}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Generate Bill ({selectedLRs.length})
                    </button>
                    <button
                        onClick={onAddNew}
                        className="bg-ssk-red text-white font-bold py-2 px-4 rounded hover:bg-red-700"
                    >
                        ADD NEW LR
                    </button>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-200">
                        <tr>
                            <th scope="col" className="p-2">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-ssk-blue focus:ring-ssk-blue border-gray-300 rounded"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedLRs(lorryReceipts.map(lr => lr.lrNo));
                                        } else {
                                            setSelectedLRs([]);
                                        }
                                    }}
                                    checked={selectedLRs.length > 0 && selectedLRs.length === lorryReceipts.length}
                                    />
                            </th>
                            <th scope="col" className="px-3 py-3">SR. NO</th>
                            <th scope="col" className="px-3 py-3">LR. NO</th>
                            <th scope="col" className="px-3 py-3">DATE</th>
                            <th scope="col" className="px-3 py-3">TRUCK NO</th>
                            <th scope="col" className="px-3 py-3">FROM</th>
                            <th scope="col" className="px-3 py-3">TO</th>
                            <th scope="col" className="px-3 py-3">CONSIGNOR</th>
                            <th scope="col" className="px-3 py-3">CONSIGNEE</th>
                            <th scope="col" className="px-3 py-3">WT.</th>
                            <th scope="col" className="px-3 py-3">FREIGHT</th>
                            <th scope="col" className="px-3 py-3">CREATED BY</th>
                            <th scope="col" className="px-3 py-3 text-center">ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lorryReceipts.map((lr, index) => (
                            <tr key={lr.lrNo} className="bg-white border-b hover:bg-gray-50">
                                 <td className="p-2">
                                     <input
                                        type="checkbox"
                                        className="h-4 w-4 text-ssk-blue focus:ring-ssk-blue border-gray-300 rounded"
                                        checked={selectedLRs.includes(lr.lrNo)}
                                        onChange={() => handleSelectLR(lr.lrNo)}
                                    />
                                </td>
                                <td className="px-3 py-2">{index + 1}</td>
                                <td className="px-3 py-2 font-medium text-blue-600">{lr.lrNo}</td>
                                <td className="px-3 py-2">{new Date(lr.date).toLocaleDateString('en-GB')}</td>
                                <td className="px-3 py-2">{lr.truckNo}</td>
                                <td className="px-3 py-2">{lr.fromPlace}</td>
                                <td className="px-3 py-2">{lr.toPlace}</td>
                                <td className="px-3 py-2">{lr.consignor.name}</td>
                                <td className="px-3 py-2">{lr.consignee.name}</td>
                                <td className="px-3 py-2">{lr.weight}</td>
                                <td className="px-3 py-2">{lr.freight.toLocaleString()}</td>
                                <td className="px-3 py-2">{lr.createdBy}</td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center justify-center space-x-1">
                                        <button onClick={() => onEdit(lr.lrNo)} className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded" title="Edit"><PencilIcon className="w-4 h-4"/></button>
                                        <button onClick={() => setPreviewingLR(lr)} className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded" title="Download/Print"><DownloadIcon className="w-4 h-4"/></button>
                                        <button onClick={() => onDelete(lr.lrNo)} className="p-2 text-white bg-ssk-red hover:bg-red-700 rounded" title="Delete"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {lorryReceipts.map((lr) => (
                    <div key={lr.lrNo} className="bg-gray-50 border rounded-lg p-3 space-y-3 shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-blue-600">{lr.lrNo}</p>
                                <p className="text-xs text-gray-500">{new Date(lr.date).toLocaleDateString('en-GB')} | {lr.truckNo}</p>
                            </div>
                             <input
                                type="checkbox"
                                className="h-5 w-5 text-ssk-blue focus:ring-ssk-blue border-gray-300 rounded"
                                checked={selectedLRs.includes(lr.lrNo)}
                                onChange={() => handleSelectLR(lr.lrNo)}
                            />
                        </div>
                        <div>
                            <p className="text-sm"><span className="font-semibold text-gray-600">From:</span> {lr.fromPlace}</p>
                            <p className="text-sm"><span className="font-semibold text-gray-600">To:</span> {lr.toPlace}</p>
                        </div>
                        <div>
                            <p className="text-sm"><span className="font-semibold text-gray-600">Consignor:</span> {lr.consignor.name}</p>
                            <p className="text-sm"><span className="font-semibold text-gray-600">Consignee:</span> {lr.consignee.name}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                             <p className="text-sm font-medium text-gray-800">
                                Freight: <span className="font-bold">₹{lr.freight.toLocaleString()}</span>
                             </p>
                             <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => onEdit(lr.lrNo)} className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md" title="Edit"><PencilIcon className="w-5 h-5"/></button>
                                <button onClick={() => setPreviewingLR(lr)} className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md" title="Download/Print"><DownloadIcon className="w-5 h-5"/></button>
                                <button onClick={() => onDelete(lr.lrNo)} className="p-2 text-white bg-ssk-red hover:bg-red-700 rounded-md" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {previewingLR && (
                <LRPreviewModal
                    isOpen={!!previewingLR}
                    onClose={() => setPreviewingLR(null)}
                    lr={previewingLR}
                    companyDetails={companyDetails}
                    isReadOnly={true}
                />
            )}
            {isInvoiceModalOpen && (
                <InvoiceModal
                    isOpen={isInvoiceModalOpen}
                    onClose={() => setIsInvoiceModalOpen(false)}
                    lorryReceipts={lrsForInvoice}
                    companyDetails={companyDetails}
                />
            )}
        </div>
    );
};

export default LRList;