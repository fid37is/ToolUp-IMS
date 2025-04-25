// components/Dashboard.js
import { useState, useEffect, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function Dashboard({ items }) {
    const [salesData, setSalesData] = useState([]);
    const [period, setPeriod] = useState('week'); // 'week', 'month', 'year'
    const [loading, setLoading] = useState(false);

    const fetchSalesData = useCallback(async () => {
        setLoading(true);
        try {
            // Calculate date range based on period
            const endDate = new Date();
            const startDate = new Date();

            if (period === 'week') {
                startDate.setDate(startDate.getDate() - 7);
            } else if (period === 'month') {
                startDate.setMonth(startDate.getMonth() - 1);
            } else if (period === 'year') {
                startDate.setFullYear(startDate.getFullYear() - 1);
            }

            const response = await fetch(`/api/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
            const data = await response.json();
            setSalesData(data);
        } catch (error) {
            console.error("Failed to fetch sales data:", error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchSalesData();
    }, [fetchSalesData]);

    // Process sales data for chart
    const getChartData = () => {
        // Group sales by date
        const salesByDate = salesData.reduce((acc, sale) => {
            const date = new Date(sale.date).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = { total: 0, profit: 0 };
            }
            acc[date].total += sale.total;
            acc[date].profit += sale.profit;
            return acc;
        }, {});

        const labels = Object.keys(salesByDate).sort((a, b) => new Date(a) - new Date(b));
        const totals = labels.map(date => salesByDate[date].total);
        const profits = labels.map(date => salesByDate[date].profit);

        return {
            labels,
            datasets: [
                {
                    label: 'Sales',
                    data: totals,
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    borderColor: 'rgb(53, 162, 235)',
                    borderWidth: 1,
                },
                {
                    label: 'Profit',
                    data: profits,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1,
                },
            ],
        };
    };

    // Get top selling items
    const getTopSellingItems = () => {
        // Group sales by item
        const salesByItem = salesData.reduce((acc, sale) => {
            if (!acc[sale.itemId]) {
                acc[sale.itemId] = {
                    name: sale.itemName,
                    quantity: 0,
                    total: 0
                };
            }
            acc[sale.itemId].quantity += sale.quantity;
            acc[sale.itemId].total += sale.total;
            return acc;
        }, {});

        // Convert to array and sort by quantity
        return Object.values(salesByItem)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5); // Top 5
    };

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Sales Dashboard</h2>

            <div className="mb-6">
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => setPeriod('week')}
                        className={`px-3 py-1 rounded ${period === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        Last Week
                    </button>
                    <button
                        onClick={() => setPeriod('month')}
                        className={`px-3 py-1 rounded ${period === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        Last Month
                    </button>
                    <button
                        onClick={() => setPeriod('year')}
                        className={`px-3 py-1 rounded ${period === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        Last Year
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading sales data...</div>
                ) : salesData.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500">No sales data available for this period.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-medium mb-4">Sales Trend</h3>
                            <Bar data={getChartData()} options={{ responsive: true }} />
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-medium mb-4">Top Selling Items</h3>
                            {getTopSellingItems().length === 0 ? (
                                <p className="text-gray-500 text-center py-10">No sales data available.</p>
                            ) : (
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="py-2 px-3 text-left">Item</th>
                                            <th className="py-2 px-3 text-right">Quantity Sold</th>
                                            <th className="py-2 px-3 text-right">Total Sales</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getTopSellingItems().map((item, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="py-2 px-3">{item.name}</td>
                                                <td className="py-2 px-3 text-right">{item.quantity}</td>
                                                <td className="py-2 px-3 text-right">${item.total.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium mb-2">Low Stock Items</h3>
                    {items.filter(item => item.quantity <= item.lowStockThreshold).length === 0 ? (
                        <p className="text-gray-500">No items are low in stock.</p>
                    ) : (
                        <ul className="divide-y">
                            {items
                                .filter(item => item.quantity <= item.lowStockThreshold)
                                .map(item => (
                                    <li key={item.id} className="py-2">
                                        <div className="flex justify-between">
                                            <span>{item.name}</span>
                                            <span className="text-red-500">{item.quantity} left</span>
                                        </div>
                                    </li>
                                ))
                            }
                        </ul>
                    )}
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium mb-2">Items by Category</h3>
                    {items.length === 0 ? (
                        <p className="text-gray-500">No items in inventory.</p>
                    ) : (
                        <ul className="divide-y">
                            {Object.entries(
                                items.reduce((acc, item) => {
                                    const category = item.category || 'Uncategorized';
                                    if (!acc[category]) acc[category] = 0;
                                    acc[category]++;
                                    return acc;
                                }, {})
                            ).map(([category, count]) => (
                                <li key={category} className="py-2">
                                    <div className="flex justify-between">
                                        <span>{category}</span>
                                        <span>{count} items</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium mb-2">Inventory Summary</h3>
                    <ul className="divide-y">
                        <li className="py-2">
                            <div className="flex justify-between">
                                <span>Total Items</span>
                                <span>{items.length}</span>
                            </div>
                        </li>
                        <li className="py-2">
                            <div className="flex justify-between">
                                <span>Total Value</span>
                                <span>${items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                            </div>
                        </li>
                        <li className="py-2">
                            <div className="flex justify-between">
                                <span>Average Price</span>
                                <span>
                                    ${items.length > 0
                                        ? (items.reduce((sum, item) => sum + item.price, 0) / items.length).toFixed(2)
                                        : '0.00'}
                                </span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}