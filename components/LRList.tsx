import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { LorryReceipt, CompanyDetails } from '../types';
import { PencilIcon, TrashIcon, DownloadIcon, SearchIcon, PrintIcon, FilterIcon, DotsVerticalIcon, DashboardIcon } from './icons';
import LRPreviewModal, { LRContent } from './LRPreviewModal';
import InvoiceModal from './InvoiceModal';

interface LRListProps {
    lorryReceipts: LorryReceipt[];
    onEdit: (lrNo: string) => void;
    onDelete: (lrNo: string) => void;
    onAddNew: () => void;
    companyDetails: CompanyDetails;
    onBackToDashboard: () => void;
}

const LRList: React.FC<LRListProps> = ({ lorryReceipts, onEdit, onDelete, onAddNew, companyDetails, onBackToDashboard }) => {
    const [previewingLR, setPreviewingLR] = useState<LorryReceipt | null>(null);
    const [selectedLRs, setSelectedLRs] = useState<string[]>([]);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [isPrinting, setIsPrinting] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [openMenuLrNo, setOpenMenuLrNo] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuLrNo(null);
            }
        };

        if (openMenuLrNo) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuLrNo]);


    const filteredLRs = useMemo(() => {
        return lorryReceipts.filter(lr => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' ||
                lr.truckNo.toLowerCase().includes(lowerSearchTerm) ||
                lr.consignor.name.toLowerCase().includes(lowerSearchTerm) ||
                lr.consignee.name.toLowerCase().includes(lowerSearchTerm);

            const lrDate = new Date(lr.date);
            const fromDate = dateRange.from ? new Date(dateRange.from) : null;
            const toDate = dateRange.to ? new Date(dateRange.to) : null;
            
            if (fromDate) fromDate.setHours(0, 0, 0, 0);
            if (toDate) toDate.setHours(23, 59, 59, 999);

            const matchesDate = (!fromDate || lrDate >= fromDate) && (!toDate || lrDate <= toDate);

            return matchesSearch && matchesDate;
        });
    }, [lorryReceipts, searchTerm, dateRange]);


    const handleSelectLR = (lrNo: string) => {
        setSelectedLRs(prev =>
            prev.includes(lrNo)
                ? prev.filter(no => no !== lrNo)
                : [...prev, lrNo]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedLRs(filteredLRs.map(lr => lr.lrNo));
        } else {
            setSelectedLRs([]);
        }
    };
    
    const handleClearFilters = () => {
        setSearchTerm('');
        setDateRange({ from: '', to: '' });
    }

    const lrsForInvoice = lorryReceipts.filter(lr => selectedLRs.includes(lr.lrNo));
    const lrsToPrint = lorryReceipts.filter(lr => selectedLRs.includes(lr.lrNo));
    const printRoot = document.getElementById('print-root');

    const handlePrintSelected = () => {
        if (lrsToPrint.length > 0) {
            setIsPrinting(true);
        }
    };

    useEffect(() => {
        if (isPrinting) {
            const handleAfterPrint = () => {
                setIsPrinting(false);
                window.removeEventListener('afterprint', handleAfterPrint);
            };
            window.addEventListener('afterprint', handleAfterPrint);

            // Timeout ensures content is rendered to the portal before print dialog opens
            const timer = setTimeout(() => {
                window.print();
            }, 100);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('afterprint', handleAfterPrint);
            };
        }
    }, [isPrinting]);

    return (
        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-4 self-start sm:self-center">
                    <button onClick={onBackToDashboard} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Back to Dashboard">
                        <DashboardIcon className="w-6 h-6 text-gray-600"/>
                    </button>
                    <h2 className="text-2xl font-bold text-ssk-blue">View LR Details</h2>
                </div>
                 <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                     <button
                        onClick={handlePrintSelected}
                        disabled={selectedLRs.length === 0}
                        className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-md transition-transform hover:scale-105"
                    >
                        <PrintIcon className="w-5 h-5" />
                        Print ({selectedLRs.length})
                    </button>
                    <button
                        onClick={() => setIsInvoiceModalOpen(true)}
                        disabled={selectedLRs.length === 0}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md transition-transform hover:scale-105"
                    >
                        Generate Bill ({selectedLRs.length})
                    </button>
                    <button
                        onClick={onAddNew}
                        className="bg-ssk-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 shadow-md transition-transform hover:scale-105"
                    >
                        ADD NEW LR
                    </button>
                </div>
            </div>

            {/* Filtering Toolbar */}
            <div className="mb-4 p-4 bg-gray-50/50 rounded-lg border">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* Search always visible */}
                    <div className="relative flex-grow w-full">
                        <input
                            type="text"
                            placeholder="Search by Truck No, Consignor, or Consignee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-10 border rounded-md shadow-inner"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    
                    {/* Filter button for mobile */}
                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="md:hidden w-full flex items-center justify-center gap-2 bg-white text-gray-700 p-2 rounded-md shadow-sm border">
                        <FilterIcon className="w-5 h-5"/>
                        <span>Filters</span>
                    </button>

                    {/* Date range for desktop */}
                    <div className="hidden md:flex items-center gap-2">
                        <label>From:</label>
                        <input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))} className="p-2 border rounded-md shadow-inner"/>
                    </div>
                     <div className="hidden md:flex items-center gap-2">
                        <label>To:</label>
                        <input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))} className="p-2 border rounded-md shadow-inner"/>
                    </div>
                    <button onClick={handleClearFilters} className="hidden md:block bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 shadow-sm border">
                        Clear Filters
                    </button>
                </div>
                
                {/* Collapsible section for mobile */}
                {isFilterOpen && (
                    <div className="md:hidden mt-4 pt-4 border-t space-y-4">
                        <div className="flex items-center gap-2">
                            <label className="w-10">From:</label>
                            <input type="date" value={dateRange.from} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))} className="p-2 border rounded-md shadow-inner w-full"/>
                        </div>
                         <div className="flex items-center gap-2">
                            <label className="w-10">To:</label>
                            <input type="date" value={dateRange.to} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))} className="p-2 border rounded-md shadow-inner w-full"/>
                        </div>
                        <button onClick={handleClearFilters} className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 shadow-sm border">
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>


            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-200/80">
                        <tr>
                            <th scope="col" className="p-2">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-ssk-blue focus:ring-ssk-blue border-gray-300 rounded"
                                    onChange={handleSelectAll}
                                    checked={filteredLRs.length > 0 && selectedLRs.length === filteredLRs.length}
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
                        {filteredLRs.map((lr, index) => (
                            <tr key={lr.lrNo} className="bg-white border-b hover:bg-gray-50 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
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
                {filteredLRs.map((lr) => (
                    <div key={lr.lrNo} className="bg-white border rounded-lg p-4 space-y-3 shadow-sm hover:shadow-lg transition-shadow duration-200">
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="font-bold text-ssk-blue">{lr.lrNo}</p>
                                <p className="text-xs text-gray-500">{new Date(lr.date).toLocaleDateString('en-GB')} | {lr.truckNo}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                 <input
                                    type="checkbox"
                                    className="h-5 w-5 text-ssk-blue focus:ring-ssk-blue border-gray-300 rounded"
                                    checked={selectedLRs.includes(lr.lrNo)}
                                    onChange={() => handleSelectLR(lr.lrNo)}
                                />
                                 <div className="relative">
                                    <button
                                        onClick={() => setOpenMenuLrNo(openMenuLrNo === lr.lrNo ? null : lr.lrNo)}
                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                                    >
                                        <DotsVerticalIcon className="w-5 h-5" />
                                    </button>
                                    {openMenuLrNo === lr.lrNo && (
                                        <div ref={menuRef} className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 border">
                                            <a onClick={() => { onEdit(lr.lrNo); setOpenMenuLrNo(null); }} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                                <PencilIcon className="w-4 h-4" /> Edit LR
                                            </a>
                                            <a onClick={() => { setPreviewingLR(lr); setOpenMenuLrNo(null); }} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                                <DownloadIcon className="w-4 h-4" /> View/Download
                                            </a>
                                            <a onClick={() => { onDelete(lr.lrNo); setOpenMenuLrNo(null); }} className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer border-t">
                                                <TrashIcon className="w-4 h-4" /> Delete
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                                <p className="text-xs text-gray-500">From</p>
                                <p className="font-medium">{lr.fromPlace}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">To</p>
                                <p className="font-medium">{lr.toPlace}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500">Consignor</p>
                                <p className="font-medium">{lr.consignor.name}</p>
                            </div>
                             <div className="col-span-2">
                                <p className="text-xs text-gray-500">Consignee</p>
                                <p className="font-medium">{lr.consignee.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 mt-2 border-t">
                             <p className="text-sm font-medium text-gray-800">
                                Freight: <span className="font-bold">₹{lr.freight.toLocaleString()}</span>
                             </p>
                             <p className="text-xs text-gray-500">
                                 WT: {lr.weight}
                             </p>
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
            {isPrinting && printRoot && ReactDOM.createPortal(
                <div>
                    {lrsToPrint.map((lr) => (
                        <div key={lr.lrNo} className="page-break">
                            <LRContent lr={lr} companyDetails={companyDetails} showCompanyDetails={true} />
                        </div>
                    ))}
                </div>,
                printRoot
            )}
        </div>
    );
};

export default LRList;