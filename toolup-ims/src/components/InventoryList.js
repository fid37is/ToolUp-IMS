"use client"
import { useState } from 'react';
import Image from 'next/image';

export default function InventoryList({ items, onUpdateItem, onSellItem, onDeleteItem }) {
    const [editingId, setEditingId] = useState(null);
    const [tempItem, setTempItem] = useState({});
    const [sellQuantity, setSellQuantity] = useState(1);
    const [sellModalItem, setSellModalItem] = useState(null);

    const startEditing = (item) => {
        setEditingId(item.id);
        setTempItem({ ...item });
    };

    const saveEdit = () => {
        onUpdateItem(tempItem);
        setEditingId(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTempItem({
            ...tempItem,
            [name]: name === 'quantity' || name === 'price' || name === 'costPrice' ?
                parseFloat(value) : value
        });
    };

    const openSellModal = (item) => {
        setSellModalItem(item);
        setSellQuantity(1);
    };

    const handleSell = () => {
        onSellItem(sellModalItem, parseInt(sellQuantity));
        setSellModalItem(null);
        setSellQuantity(1);
    };

    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Inventory Items</h2>

            {items.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-sm">
                    <p className="text-gray-500">No items in inventory. Add your first item!</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg shadow-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left">Image</th>
                                <th className="py-3 px-4 text-left">Name</th>
                                <th className="py-3 px-4 text-left">Category</th>
                                <th className="py-3 px-4 text-left">SKU</th>
                                <th className="py-3 px-4 text-left">Price</th>
                                <th className="py-3 px-4 text-left">Cost</th>
                                <th className="py-3 px-4 text-left">Quantity</th>
                                <th className="py-3 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {items.map((item) => (
                                <tr key={item.id} className={item.quantity <= item.lowStockThreshold ? "bg-red-50" : ""}>
                                    <td className="py-2 px-4">
                                        {item.imageUrl ? (
                                            <div className="relative h-12 w-12">
                                                <Image
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    layout="fill"
                                                    objectFit="cover"
                                                    className="rounded-md"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                                                <span className="text-gray-500 text-xs">No image</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-2 px-4">
                                        {editingId === item.id ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={tempItem.name}
                                                onChange={handleInputChange}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            item.name
                                        )}
                                    </td>
                                    <td className="py-2 px-4">
                                        {editingId === item.id ? (
                                            <input
                                                type="text"
                                                name="category"
                                                value={tempItem.category}
                                                onChange={handleInputChange}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            item.category
                                        )}
                                    </td>
                                    <td className="py-2 px-4">
                                        {editingId === item.id ? (
                                            <input
                                                type="text"
                                                name="sku"
                                                value={tempItem.sku}
                                                onChange={handleInputChange}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            item.sku
                                        )}
                                    </td>
                                    <td className="py-2 px-4">
                                        {editingId === item.id ? (
                                            <input
                                                type="number"
                                                name="price"
                                                value={tempItem.price}
                                                onChange={handleInputChange}
                                                className="border rounded px-2 py-1 w-full"
                                                step="0.01"
                                            />
                                        ) : (
                                            `$${item.price.toFixed(2)}`
                                        )}
                                    </td>
                                    <td className="py-2 px-4">
                                        {editingId === item.id ? (
                                            <input
                                                type="number"
                                                name="costPrice"
                                                value={tempItem.costPrice}
                                                onChange={handleInputChange}
                                                className="border rounded px-2 py-1 w-full"
                                                step="0.01"
                                            />
                                        ) : (
                                            `$${item.costPrice.toFixed(2)}`
                                        )}
                                    </td>
                                    <td className="py-2 px-4">
                                        {editingId === item.id ? (
                                            <input
                                                type="number"
                                                name="quantity"
                                                value={tempItem.quantity}
                                                onChange={handleInputChange}
                                                className="border rounded px-2 py-1 w-full"
                                                min="0"
                                            />
                                        ) : (
                                            <>
                                                {item.quantity}
                                                {item.quantity <= item.lowStockThreshold && (
                                                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                                        Low Stock
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </td>
                                    <td className="py-2 px-4">
                                        {editingId === item.id ? (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={saveEdit}
                                                    className="text-sm bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="text-sm bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => startEditing(item)}
                                                    className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => openSellModal(item)}
                                                    className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                                >
                                                    Sell
                                                </button>
                                                <button
                                                    onClick={() => onDeleteItem(item.id)}
                                                    className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Sell Modal */}
            {sellModalItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-lg font-semibold mb-4">Sell {sellModalItem.name}</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity (Available: {sellModalItem.quantity})
                            </label>
                            <input
                                type="number"
                                value={sellQuantity}
                                onChange={(e) => setSellQuantity(e.target.value)}
                                min="1"
                                max={sellModalItem.quantity}
                                className="border rounded px-3 py-2 w-full"
                            />
                        </div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Sale Amount: ${(sellModalItem.price * sellQuantity).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                                Profit: ${((sellModalItem.price - sellModalItem.costPrice) * sellQuantity).toFixed(2)}
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setSellModalItem(null)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSell}
                                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                Complete Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
