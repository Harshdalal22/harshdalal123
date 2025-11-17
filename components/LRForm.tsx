import React, { useState, useEffect } from 'react';
import { LorryReceipt, Item, PartyDetails, DetailedCharges, CompanyDetails } from '../types';
import LRPreviewModal from './LRPreviewModal';
import { PlusIcon, TrashIcon, CreateIcon, ListIcon, SparklesIcon } from './icons';
import { suggestLRDetails } from '../services/geminiService';
import { toast } from 'react-hot-toast';


interface LRFormProps {
    onSave: (lr: LorryReceipt) => void;
    existingLR: LorryReceipt | null;
    onCancel: () => void;
    companyDetails: CompanyDetails;
    lorryReceipts: LorryReceipt[];
}

const initialPartyState: PartyDetails = { name: '', address: '', city: '', contact: '', pan: '', gst: '' };

const initialChargesState: DetailedCharges = {
    hamail: 0, surCharge: 0, stCharge: 0, collectionCharge: 0, ddCharge: 0, otherCharge: 0, riskCharge: 0
};

const initialLRState: Omit<LorryReceipt, 'lrNo'> = {
    lrType: 'Original',
    truckNo: '',
    date: new Date().toISOString().split('T')[0],
    fromPlace: '',
    toPlace: '',
    invoiceNo: '',
    invoiceAmount: 0,
    invoiceDate: '',
    poNo: '',
    poDate: '',
    ewayBillNo: '',
    ewayBillDate: '',
    ewayExDate: '',
    addressOfDelivery: '',
    chargedWeight: 0,
    gstPaidBy: 'Transporter',
    consignor: { ...initialPartyState },
    consignee: { ...initialPartyState },
    billingTo: { ...initialPartyState },
    items: [{ description: 'corrugated box', pcs: 1, weight: 0 }],
    weight: 0,
    actualWeightMT: 0,
    freight: 0,
    charges: { ...initialChargesState },
    rate: 0,
    rateOn: 'Ton',
    remark: '',
};

const generateNewLrNo = (existingLrs: LorryReceipt[]): string => {
    const lrNumbers = existingLrs
        .map(lr => parseInt(lr.lrNo.replace(/[^0-9]/g, ''), 10))
        .filter(num => !isNaN(num));

    if (lrNumbers.length === 0) {
        return 'HR/00001';
    }

    const maxLrNo = Math.max(...lrNumbers);
    return `HR/${String(maxLrNo + 1).padStart(5, '0')}`;
};

const Fieldset: React.FC<{ legend: string; children: React.ReactNode; className?: string }> = ({ legend, children, className = '' }) => (
    <fieldset className="border border-gray-300 p-4 rounded-lg mb-6 shadow-sm bg-white">
        <legend className="px-2 font-bold text-base text-ssk-blue">{legend}</legend>
        <div className={className}>
            {children}
        </div>
    </fieldset>
);


const LRForm: React.FC<LRFormProps> = ({ onSave, existingLR, onCancel, companyDetails, lorryReceipts }) => {
    const [formData, setFormData] = useState<LorryReceipt>(() => ({
        ...initialLRState,
        lrNo: existingLR ? existingLR.lrNo : generateNewLrNo(lorryReceipts),
    }));
    const [billingPartyType, setBillingPartyType] = useState<'Consignor' | 'Consignee' | 'Other'>('Consignor');
    const [showPreview, setShowPreview] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);

    
    useEffect(() => {
        if (existingLR) {
            setFormData(existingLR);
            if (JSON.stringify(existingLR.billingTo) === JSON.stringify(existingLR.consignor)) {
                setBillingPartyType('Consignor');
            } else if (JSON.stringify(existingLR.billingTo) === JSON.stringify(existingLR.consignee)) {
                setBillingPartyType('Consignee');
            } else {
                setBillingPartyType('Other');
            }
        } else {
            const newLrNo = generateNewLrNo(lorryReceipts);
            setFormData({
                ...initialLRState,
                lrNo: newLrNo,
            });
             setBillingPartyType('Consignor');
        }
    }, [existingLR, lorryReceipts]);
    
    useEffect(() => {
        if (billingPartyType === 'Consignor') {
             setFormData(prev => ({ ...prev, billingTo: prev.consignor }));
        } else if (billingPartyType === 'Consignee') {
            setFormData(prev => ({ ...prev, billingTo: prev.consignee }));
        }
    }, [billingPartyType, formData.consignor, formData.consignee]);


    useEffect(() => {
        const totalWeight = formData.items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
        setFormData(prev => ({ ...prev, weight: totalWeight }));
    }, [formData.items]);

    useEffect(() => {
        const calculatedFreight = (Number(formData.actualWeightMT) || 0) * (Number(formData.rate) || 0);
        setFormData(prev => ({ ...prev, freight: calculatedFreight }));
    }, [formData.actualWeightMT, formData.rate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePartyChange = (party: 'consignor' | 'consignee' | 'billingTo', e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [party]: {
                ...prev[party],
                [name]: value
            }
        }));
    };
    
    const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const addItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, { description: '', pcs: 0, weight: 0 }] }));
    };

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, items: newItems }));
        }
    };

    const handleChargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            charges: {
                ...prev.charges,
                [name]: parseFloat(value) || 0
            }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.truckNo || !formData.fromPlace || !formData.toPlace || !formData.consignor.name || !formData.consignee.name) {
            alert('Please fill all required fields marked with *.');
            return;
        }
        onSave(formData);
        setShowPreview(true);
    };
    
    const handleClosePreviewAndExit = () => {
        setShowPreview(false);
        onCancel();
    };

    const handleCreateNew = () => {
        if(window.confirm('Are you sure you want to discard current changes and create a new LR?')) {
            const newLrNo = generateNewLrNo(lorryReceipts);
            setFormData({
                ...initialLRState,
                lrNo: newLrNo,
            });
            setBillingPartyType('Consignor');
        }
    }

    const handleAiAutofill = async () => {
        setIsAiLoading(true);
        const toastId = toast.loading('AI is thinking...');

        try {
            const suggestions = await suggestLRDetails(formData, lorryReceipts);
            toast.dismiss(toastId);

            if (suggestions && Object.keys(suggestions).length > 0) {
                setFormData(prev => {
                    const newFormData = { ...prev };
                    const isPartyEmpty = (party: PartyDetails) => !party.name && !party.address;

                    if (suggestions.consignor && isPartyEmpty(prev.consignor)) {
                        newFormData.consignor = { ...initialPartyState, ...suggestions.consignor };
                    }
                    if (suggestions.consignee && isPartyEmpty(prev.consignee)) {
                        newFormData.consignee = { ...initialPartyState, ...suggestions.consignee };
                    }
                    if (billingPartyType === 'Other' && suggestions.billingTo && isPartyEmpty(prev.billingTo)) {
                        newFormData.billingTo = { ...initialPartyState, ...suggestions.billingTo };
                    }
                    if (suggestions.invoiceNo && !prev.invoiceNo) {
                        newFormData.invoiceNo = suggestions.invoiceNo;
                    }
                    if (suggestions.remark && !prev.remark) {
                        newFormData.remark = suggestions.remark;
                    }
                    return newFormData;
                });
                toast.success('AI suggestions applied!');
            } else {
                toast.error('AI could not provide suggestions. Please fill manually.');
            }
        } catch (error) {
            console.error("AI Autofill Error:", error);
            toast.dismiss(toastId);
            toast.error('An error occurred while getting AI suggestions.');
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const renderPartySection = (title: string, partyKey: 'consignor' | 'consignee' | 'billingTo') => {
        const isDisabled = partyKey === 'billingTo' && billingPartyType !== 'Other';
        const disabledClass = isDisabled ? 'bg-gray-100 cursor-not-allowed' : 'text-gray-900 placeholder-gray-500';

        return (
            <div className="border border-gray-300">
                <h3 className="bg-ssk-red text-white p-2 font-bold text-sm">{title.toUpperCase()}</h3>
                <div className="p-2 space-y-1">
                    <textarea name="name" value={formData[partyKey].name} onChange={(e) => handlePartyChange(partyKey, e)} placeholder="NAME" className={`w-full text-xs p-1 border rounded-sm ${disabledClass}`} rows={2} disabled={isDisabled}></textarea>
                    <textarea name="address" value={formData[partyKey].address} onChange={(e) => handlePartyChange(partyKey, e)} placeholder="ADDRESS" className={`w-full text-xs p-1 border rounded-sm ${disabledClass}`} rows={3} disabled={isDisabled}></textarea>
                    <input type="text" name="city" value={formData[partyKey].city} onChange={(e) => handlePartyChange(partyKey, e)} placeholder="CITY" className={`w-full text-xs p-1 border rounded-sm ${disabledClass}`} disabled={isDisabled}/>
                    <input type="text" name="contact" value={formData[partyKey].contact} onChange={(e) => handlePartyChange(partyKey, e)} placeholder="CONTACT" className={`w-full text-xs p-1 border rounded-sm ${disabledClass}`} disabled={isDisabled}/>
                    <input type="text" name="pan" value={formData[partyKey].pan} onChange={(e) => handlePartyChange(partyKey, e)} placeholder="PAN" className={`w-full text-xs p-1 border rounded-sm ${disabledClass}`} disabled={isDisabled}/>
                    <input type="text" name="gst" value={formData[partyKey].gst} onChange={(e) => handlePartyChange(partyKey, e)} placeholder="GST" className={`w-full text-xs p-1 border rounded-sm ${disabledClass}`} disabled={isDisabled}/>
                </div>
            </div>
        );
    }
    
    const totalCharges = Object.values(formData.charges).reduce((sum, charge) => sum + (charge || 0), 0);

    const inputClass = "w-full p-2 border-gray-200 bg-gray-100 rounded-md text-sm text-gray-900 placeholder-gray-500";
    const labelClass = "block text-xs font-bold text-gray-600 uppercase mb-1";

    return (
        <div className="bg-slate-50 p-4 sm:p-6 rounded-lg shadow-lg">
             <div className="flex items-center flex-wrap gap-2 mb-6 border-b pb-4">
                <button onClick={onCancel} className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-200 transition-colors text-sm">
                    <ListIcon className="w-5 h-5 mr-2" />
                    View LR Details
                </button>
                <button onClick={handleCreateNew} className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-200 transition-colors text-sm">
                    <CreateIcon className="w-5 h-5 mr-2" />
                    Create New LR
                </button>
                <button
                    onClick={handleAiAutofill}
                    disabled={isAiLoading || !formData.truckNo || !formData.fromPlace || !formData.toPlace}
                    className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-purple-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title={!formData.truckNo || !formData.fromPlace || !formData.toPlace ? "Please fill Truck No, From, and To fields first" : "Get AI suggestions"}
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    {isAiLoading ? 'Thinking...' : 'AI Autofill'}
                </button>
            </div>
            
            <form onSubmit={handleSubmit}>
                <Fieldset legend="Core Details" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4">
                    <div>
                        <label className={labelClass}>LR TYPE*</label>
                        <div className="flex items-center space-x-4 h-10">
                             <div className="flex items-center">
                                <input id="dummy" type="radio" name="lrType" value="Dummy" checked={formData.lrType === 'Dummy'} onChange={handleChange} className="h-4 w-4 text-ssk-blue focus:ring-ssk-blue border-gray-300" />
                                <label htmlFor="dummy" className="ml-2 block text-sm text-gray-900">Dummy</label>
                            </div>
                            <div className="flex items-center">
                                <input id="original" type="radio" name="lrType" value="Original" checked={formData.lrType === 'Original'} onChange={handleChange} className="h-4 w-4 text-ssk-blue focus:ring-ssk-blue border-gray-300"/>
                                <label htmlFor="original" className="ml-2 block text-sm text-gray-900">Original</label>
                            </div>
                        </div>
                    </div>
                    <div><label className={labelClass}>TRUCK NO*</label><input type="text" name="truckNo" placeholder="TRUCK NO" value={formData.truckNo} onChange={handleChange} className={`${inputClass} border-red-300`} required /></div>
                    <div><label className={labelClass}>C Note NO*</label><input type="text" value={formData.lrNo} disabled className={`${inputClass} bg-gray-200 cursor-not-allowed`} /></div>
                    <div><label className={labelClass}>DATE*</label><input type="date" name="date" value={formData.date} onChange={handleChange} className={inputClass} required /></div>
                    <div><label className={labelClass}>FROM PLACE*</label><input type="text" name="fromPlace" placeholder="FROM PLACE" value={formData.fromPlace} onChange={handleChange} className={inputClass} required /></div>
                    <div><label className={labelClass}>TO PLACE*</label><input type="text" name="toPlace" placeholder="TO PLACE" value={formData.toPlace} onChange={handleChange} className={inputClass} required /></div>
                </Fieldset>
                
                <Fieldset legend="Shipment Details" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-4">
                     <div><label className={labelClass}>INVOICE</label><input type="text" name="invoiceNo" placeholder="INVOICE" value={formData.invoiceNo} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>INVOICE AMOUNT</label><input type="number" name="invoiceAmount" placeholder="INVOICE AMOUNT" value={formData.invoiceAmount} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>INVOICE DATE</label><input type="date" name="invoiceDate" value={formData.invoiceDate} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>EWAY BILL NO</label><input type="text" name="ewayBillNo" placeholder="EWAY BILL NO" value={formData.ewayBillNo} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>EWAY BILL DATE</label><input type="date" name="ewayBillDate" value={formData.ewayBillDate} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>EWAY EX. DATE</label><input type="date" name="ewayExDate" value={formData.ewayExDate} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>P.O. NO</label><input type="text" name="poNo" placeholder="P.O. NO" value={formData.poNo} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>P.O. DATE</label><input type="date" name="poDate" value={formData.poDate} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>ADDRESS OF DELIVERY</label><input type="text" name="addressOfDelivery" placeholder="ADDRESS OF DELIVERY" value={formData.addressOfDelivery} onChange={handleChange} className={inputClass} /></div>
                </Fieldset>
                
                 <Fieldset legend="Billing Details" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>BILLING PARTY</label>
                        <div className="flex items-center space-x-4 mt-2">
                             <div className="flex items-center">
                                <input id="bill_consignor" type="radio" name="billingPartyType" value="Consignor" checked={billingPartyType === 'Consignor'} onChange={() => setBillingPartyType('Consignor')} className="h-4 w-4 text-ssk-blue focus:ring-ssk-blue border-gray-300" />
                                <label htmlFor="bill_consignor" className="ml-2 block text-sm text-gray-900">Consignor</label>
                            </div>
                            <div className="flex items-center">
                                <input id="bill_consignee" type="radio" name="billingPartyType" value="Consignee" checked={billingPartyType === 'Consignee'} onChange={() => setBillingPartyType('Consignee')} className="h-4 w-4 text-ssk-blue focus:ring-ssk-blue border-gray-300" />
                                <label htmlFor="bill_consignee" className="ml-2 block text-sm text-gray-900">Consignee</label>
                            </div>
                             <div className="flex items-center">
                                <input id="bill_other" type="radio" name="billingPartyType" value="Other" checked={billingPartyType === 'Other'} onChange={() => setBillingPartyType('Other')} className="h-4 w-4 text-ssk-blue focus:ring-ssk-blue border-gray-300" />
                                <label htmlFor="bill_other" className="ml-2 block text-sm text-gray-900">Other</label>
                            </div>
                        </div>
                     </div>
                     <div>
                        <label className={labelClass}>GST PAID BY</label>
                         <select name="gstPaidBy" value={formData.gstPaidBy} onChange={handleChange} className={inputClass}>
                            <option>Transporter</option>
                            <option>Consignor</option>
                            <option>Consignee</option>
                        </select>
                     </div>
                </Fieldset>

                <Fieldset legend="Party Details" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderPartySection('Consignor', 'consignor')}
                    {renderPartySection('Consignee', 'consignee')}
                    {billingPartyType === 'Other' && renderPartySection('Billing To', 'billingTo')}
                </Fieldset>

                <div className="border border-gray-300 p-3 rounded-lg shadow-sm bg-white">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-base text-gray-800">Item Details</h3>
                        <button type="button" onClick={addItem} className="flex items-center bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-gray-200 transition-colors">
                            <PlusIcon className="w-4 h-4 mr-1" />
                            Add Row
                        </button>
                    </div>
                    <div className="grid grid-cols-12 gap-2 bg-gray-50 p-2 rounded-t-md font-bold text-gray-600 text-left text-xs">
                        <div className="col-span-1">#</div>
                        <div className="col-span-6">DESCRIPTION</div>
                        <div className="col-span-2">PCS</div>
                        <div className="col-span-2">WEIGHT</div>
                        <div className="col-span-1"></div>
                    </div>
                    <div className="border-l border-r border-b border-gray-200 rounded-b-md">
                        {formData.items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 border-b last:border-b-0">
                                <div className="col-span-1 text-gray-500">{index + 1}</div>
                                <div className="col-span-6"><input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="w-full p-1.5 border rounded-md text-sm text-gray-900 placeholder-gray-500"/></div>
                                <div className="col-span-2"><input type="number" value={item.pcs} onChange={(e) => handleItemChange(index, 'pcs', parseInt(e.target.value) || 0)} className="w-full p-1.5 border rounded-md text-sm text-gray-900 placeholder-gray-500" placeholder="PCS" /></div>
                                <div className="col-span-2"><input type="number" value={item.weight} onChange={(e) => handleItemChange(index, 'weight', parseFloat(e.target.value) || 0)} className="w-full p-1.5 border rounded-md text-sm text-gray-900 placeholder-gray-500" placeholder="Weight"/></div>
                                <div className="col-span-1 text-right">
                                    {formData.items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(index)} className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"><TrashIcon className="w-5 h-5"/></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Fieldset legend="Weight & Rate" className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div>
                        <label className={labelClass}>TOTAL PKGS WEIGHT</label>
                        <input type="number" name="weight" value={formData.weight} readOnly placeholder="Auto-calculated" className={`${inputClass} bg-gray-200 cursor-not-allowed`} />
                    </div>
                    <div><label className={labelClass}>ACTUAL WEIGHT (MT)</label><input type="number" name="actualWeightMT" value={formData.actualWeightMT} onChange={handleChange} placeholder="WEIGHT (MT)" className={inputClass} /></div>
                     <div><label className={labelClass}>CHARGED WEIGHT</label><input type="number" name="chargedWeight" placeholder="CHARGED WEIGHT" value={formData.chargedWeight} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>RATE</label><input type="number" name="rate" value={formData.rate} onChange={handleChange} placeholder="RATE" className={inputClass} /></div>
                    <div>
                        <label className={labelClass}>RATE ON</label>
                        <input type="text" name="rateOn" value={formData.rateOn} readOnly className={`${inputClass} bg-gray-200 cursor-not-allowed`} />
                    </div>
                </Fieldset>
                
                <Fieldset legend="Charges Breakdown" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <div><label className={labelClass}>Hamail</label><input type="number" name="hamail" value={formData.charges.hamail} onChange={handleChargeChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Surcharge</label><input type="number" name="surCharge" value={formData.charges.surCharge} onChange={handleChargeChange} className={inputClass} /></div>
                    <div><label className={labelClass}>ST Charge</label><input type="number" name="stCharge" value={formData.charges.stCharge} onChange={handleChargeChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Collection</label><input type="number" name="collectionCharge" value={formData.charges.collectionCharge} onChange={handleChargeChange} className={inputClass} /></div>
                    <div><label className={labelClass}>D.Dty Charge</label><input type="number" name="ddCharge" value={formData.charges.ddCharge} onChange={handleChargeChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Other</label><input type="number" name="otherCharge" value={formData.charges.otherCharge} onChange={handleChargeChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Risk</label><input type="number" name="riskCharge" value={formData.charges.riskCharge} onChange={handleChargeChange} className={inputClass} /></div>
                </Fieldset>
                
                <Fieldset legend="Totals" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>FREIGHT</label>
                        <input type="number" name="freight" value={formData.freight} readOnly placeholder="FREIGHT" className={`${inputClass} bg-gray-200 cursor-not-allowed`} />
                    </div>
                     <div>
                        <label className={labelClass}>TOTAL OTHER CHARGES</label>
                        <input type="number" value={totalCharges} readOnly className={`${inputClass} bg-gray-200 cursor-not-allowed`} />
                    </div>
                    <div>
                        <label className={labelClass}>GRAND TOTAL</label>
                        <input type="number" value={(Number(formData.freight) || 0) + totalCharges} readOnly className={`${inputClass} bg-green-100 border-green-300 font-bold cursor-not-allowed`} />
                    </div>
                </Fieldset>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border"><label className={labelClass}>REMARK</label><textarea name="remark" value={formData.remark} onChange={handleChange} placeholder="Enter remarks..." className={`${inputClass} h-24`}></textarea></div>
                
                <div className="flex flex-col sm:flex-row sm:justify-center gap-4 pt-6 mt-4 border-t">
                    <button type="submit" className="w-full sm:w-auto bg-ssk-blue text-white px-8 py-2.5 rounded-md hover:bg-blue-800 font-bold text-base shadow-md transition-transform transform hover:scale-105">
                        {existingLR ? 'UPDATE & SAVE' : 'PREVIEW & SAVE'}
                    </button>
                    <button type="button" onClick={onCancel} className="w-full sm:w-auto bg-ssk-red text-white px-8 py-2.5 rounded-md hover:bg-red-700 font-bold text-base shadow-md transition-transform transform hover:scale-105">
                        CANCEL
                    </button>
                </div>
            </form>
            
            {showPreview && (
                <LRPreviewModal 
                    isOpen={showPreview}
                    onClose={handleClosePreviewAndExit}
                    lr={formData}
                    companyDetails={companyDetails}
                    isReadOnly={true}
                />
            )}
        </div>
    );
};

export default LRForm;