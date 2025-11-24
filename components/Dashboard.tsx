import React from 'react';
import { LorryReceipt } from '../types';
import { CurrencyRupeeIcon, TruckIcon, UsersIcon, ListIcon, CreateIcon, PencilIcon } from './icons';

interface DashboardProps {
    lorryReceipts: LorryReceipt[];
    onAddNew: () => void;
    onViewList: () => void;
    onEditLR: (lrNo: string) => void;
}

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => (
    <div className={`bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg flex items-center space-x-4 border-l-4 ${color}`}>
        <div className="text-3xl">{icon}</div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ lorryReceipts, onAddNew, onViewList, onEditLR }) => {
    // --- Metric Calculations ---
    const totalLRs = lorryReceipts.length;
    const totalFreight = lorryReceipts.reduce((sum, lr) => sum + (Number(lr.freight) || 0), 0);
    const uniqueConsignors = new Set(lorryReceipts.map(lr => lr.consignor.name.trim())).size;
    const recentLRs = lorryReceipts.slice(0, 5);

    // --- Chart Data Calculation ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        return { 
            date, 
            label: date.toLocaleDateString('en-US', { weekday: 'short' }), 
            freight: 0 
        };
    }).reverse();

    lorryReceipts.forEach(lr => {
        const lrDate = new Date(lr.date);
        lrDate.setHours(0, 0, 0, 0);
        const dayData = last7DaysData.find(d => d.date.getTime() === lrDate.getTime());
        if (dayData) {
            dayData.freight += (Number(lr.freight) || 0);
        }
    });

    const maxFreight = Math.max(...last7DaysData.map(d => d.freight), 1); // Avoid division by zero

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b">
                <h1 className="text-3xl font-bold text-ssk-blue">Dashboard</h1>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                     <button onClick={onViewList} className="flex items-center bg-white text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors text-sm shadow-sm border">
                        <ListIcon className="w-5 h-5 mr-2" />
                        View All LRs
                    </button>
                    <button onClick={onAddNew} className="flex items-center bg-ssk-red text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700 transition-colors text-sm shadow-md">
                        <CreateIcon className="w-5 h-5 mr-2" />
                        Create New LR
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    icon={<TruckIcon className="w-8 h-8 text-blue-500"/>} 
                    title="Total Lorry Receipts" 
                    value={totalLRs} 
                    color="border-blue-500"
                />
                <StatCard 
                    icon={<CurrencyRupeeIcon className="w-8 h-8 text-green-500"/>} 
                    title="Total Freight Value" 
                    value={`₹${totalFreight.toLocaleString('en-IN')}`}
                    color="border-green-500"
                />
                <StatCard 
                    icon={<UsersIcon className="w-8 h-8 text-purple-500"/>} 
                    title="Unique Consignors" 
                    value={uniqueConsignors} 
                    color="border-purple-500"
                />
            </div>
            
            {/* Recent Activity & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Lorry Receipts</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-gray-500">
                                <tr>
                                    <th className="p-2">LR No.</th>
                                    <th className="p-2">Date</th>
                                    <th className="p-2">Truck No.</th>
                                    <th className="p-2">Consignee</th>
                                    <th className="p-2 text-right">Freight</th>
                                    <th className="p-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLRs.map(lr => (
                                    <tr key={lr.lrNo} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-2 font-medium text-blue-600">{lr.lrNo}</td>
                                        <td className="p-2">{new Date(lr.date).toLocaleDateString('en-GB')}</td>
                                        <td className="p-2">{lr.truckNo}</td>
                                        <td className="p-2">{lr.consignee.name}</td>
                                        <td className="p-2 text-right font-semibold">₹{Number(lr.freight).toLocaleString('en-IN')}</td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => onEditLR(lr.lrNo)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full" title="Edit">
                                                <PencilIcon className="w-4 h-4"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                     <h2 className="text-xl font-bold text-gray-800 mb-4">7-Day Freight Overview</h2>
                     <div className="flex justify-between items-end h-48 space-x-2">
                        {last7DaysData.map(day => (
                            <div key={day.label} className="flex-1 flex flex-col items-center justify-end">
                                <div className="text-xs text-gray-500 font-medium" title={`₹${day.freight.toLocaleString('en-IN')}`}>
                                    {`₹${(day.freight / 1000).toFixed(1)}k`}
                                </div>
                                <div 
                                    className="w-full bg-ssk-blue rounded-t-md hover:bg-blue-800 transition-colors" 
                                    style={{ height: `${(day.freight / maxFreight) * 100}%` }}
                                    title={`₹${day.freight.toLocaleString('en-IN')}`}
                                ></div>
                                <div className="text-xs text-gray-600 font-bold mt-1">{day.label}</div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
