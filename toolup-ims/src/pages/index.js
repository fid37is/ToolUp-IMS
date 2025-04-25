"use client"
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import InventoryList from '../components/InventoryList';
import AddItemModal from '../components/AddItemModal';
import Statistics from '../components/Statistics';
import SearchBar from '../components/SearchBar';
import { getAllItems, saveItem, updateItem, deleteItem } from '../utils/inventoryService';

export default function Home() {
    const [items, setItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({
        totalItems: 0,
        totalValue: 0,
        totalProfit: 0,
        lowStockItems: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInventory();
    }, []);

    const calculateStats = useCallback(() => {
        const totalItems = items.length;
        const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalProfit = items.reduce((sum, item) => sum + (item.profit || 0), 0);
        const lowStockItems = items.filter(item => item.quantity <= item.lowStockThreshold).length;

        setStats({ totalItems, totalValue, totalProfit, lowStockItems });
    }, [items]);

    useEffect(() => {
        calculateStats();
    }, [calculateStats]);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const data = await getAllItems();
            setItems(data);
        } catch (error) {
            console.error("Failed to load inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (newItem) => {
        try {
            const savedItem = await saveItem({
                ...newItem,
                lowStockThreshold: newItem.lowStockThreshold || 5,
                profit: 0,
                createdAt: new Date().toISOString()
            });
            setItems([...items, savedItem]);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to add item:", error);
        }
    };

    const handleUpdateItem = async (updatedItem) => {
        try {
            await updateItem(updatedItem);
            setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
        } catch (error) {
            console.error("Failed to update item:", error);
        }
    };

    const handleSellItem = async (item, quantitySold) => {
        if (quantitySold > item.quantity) {
            alert("Cannot sell more than available quantity");
            return;
        }

        const profit = quantitySold * (item.price - item.costPrice);
        const updatedItem = {
            ...item,
            quantity: item.quantity - quantitySold,
            profit: (item.profit || 0) + profit
        };

        await handleUpdateItem(updatedItem);
    };

    const handleDeleteItem = async (itemId) => {
        try {
            await deleteItem(itemId);
            setItems(items.filter(item => item.id !== itemId));
        } catch (error) {
            console.error("Failed to delete item:", error);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>Tool Up - Inventory Tracker</title>
                <meta name="description" content="Inventory management system for Tool Up" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="container mx-auto px-4 py-6">
                <header className="mb-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-800">Tool Up <span className="text-blue-500">Inventory</span></h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                        >
                            Add New Item
                        </button>
                    </div>
                    <p className="text-gray-600 mt-1">close to you!</p>
                </header>

                <Statistics stats={stats} />

                <div className="mt-6">
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading inventory...</div>
                ) : (
                    <InventoryList
                        items={filteredItems}
                        onUpdateItem={handleUpdateItem}
                        onSellItem={handleSellItem}
                        onDeleteItem={handleDeleteItem}
                    />
                )}
            </main>

            <AddItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddItem}
            />
        </div>
    );
}