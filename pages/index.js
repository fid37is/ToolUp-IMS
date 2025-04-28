"use client"
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import InventoryList from '../src/components/InventoryList';
import AddItemModal from '../src/components/AddItemModal';
import DeleteConfirmationModal from '../src/components/DeleteConfirmationModal';
import AlertModal from '../src/components/AlertModal';
import Statistics from '../src/components/Statistics';
import SearchBar from '../src/components/SearchBar';
import { getAllItems, saveItem, updateItem, deleteItem } from '../src/utils/inventoryService';
import { Plus } from 'lucide-react';



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

    // State for delete confirmation modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // State for alert modal
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ title: '', message: '' });

    // Define showAlert before using it in loadInventory
    const showAlert = useCallback((title, message) => {
        setAlertInfo({ title, message });
        setAlertModalOpen(true);
    }, []);

    // Memoize the loadInventory function with useCallback
    const loadInventory = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllItems();
            setItems(data);
        } catch (error) {
            console.error("Failed to load inventory:", error);
            showAlert("Error", "Failed to load inventory. Please refresh the page.");
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    // Now add loadInventory to the useEffect dependency array
    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

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
            showAlert("Error", "Failed to add item. Please try again.");
        }
    };

    const handleUpdateItem = async (updatedItem) => {
        try {
            await updateItem(updatedItem);
            setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
        } catch (error) {
            console.error("Failed to update item:", error);
            showAlert("Error", "Failed to update item. Please try again.");
        }
    };

    const handleSellItem = async (item, quantitySold) => {
        if (quantitySold > item.quantity) {
            showAlert("Invalid Operation", "Cannot sell more than available quantity");
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

    // Function to show the delete confirmation modal
    const confirmDelete = (itemId) => {
        setItemToDelete(itemId);
        setDeleteModalOpen(true);
    };

    // Function to execute the delete operation
    const executeDelete = async () => {
        if (!itemToDelete) return;

        try {
            await deleteItem(itemToDelete);
            setItems(items.filter(item => item.id !== itemToDelete));
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error("Failed to delete item:", error);
            setDeleteModalOpen(false);
            showAlert("Error", "Failed to delete item. Please try again.");
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
                        <h1 className="text-2xl font-bold text-gray-800">Tool Up <span className="text-blue-500">Inventory</span></h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center gap-2 btn-primary bg-[#2d314]"
                        >
                            <Plus className="w-5 h-5" />
                            <span>New Item</span>
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
                        onDeleteItem={confirmDelete}
                    />
                )}
            </main>

            {/* Add Item Modal */}
            <AddItemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddItem}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={executeDelete}
                itemId={itemToDelete}
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alertModalOpen}
                onClose={() => setAlertModalOpen(false)}
                title={alertInfo.title}
                message={alertInfo.message}
            />
        </div>
    );
}