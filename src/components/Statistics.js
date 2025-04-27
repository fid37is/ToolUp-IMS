// components/Statistics.js
export default function Statistics({ stats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Total Items</h3>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalItems}</p>
            </div>
            <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Inventory Value</h3>
                <p className="text-2xl font-semibold text-gray-800">${stats.totalValue.toFixed(2)}</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Total Profit</h3>
                <p className="text-2xl font-semibold text-gray-800">${stats.totalProfit.toFixed(2)}</p>
            </div>
            <div className={`${stats.lowStockItems > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'} border p-4 rounded-lg`}>
                <h3 className="text-sm font-medium text-gray-500">Low Stock Items</h3>
                <p className={`text-2xl font-semibold ${stats.lowStockItems > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {stats.lowStockItems}
                </p>
            </div>
        </div>
    );
}
