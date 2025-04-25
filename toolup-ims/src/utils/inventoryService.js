// utils/inventoryService.js
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

// We'll use a Google Sheet as our database
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = 'Inventory!A:Z';

const getGoogleSheetsClient = async () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
};

// Convert row data to item object
const rowToItem = (row) => {
    if (!row || row.length < 10) return null;

    return {
        id: row[0],
        name: row[1],
        category: row[2],
        sku: row[3],
        price: parseFloat(row[4]),
        costPrice: parseFloat(row[5]),
        quantity: parseInt(row[6]),
        lowStockThreshold: parseInt(row[7]),
        imageUrl: row[8],
        profit: parseFloat(row[9]),
        createdAt: row[10]
    };
};

// Convert item object to row data
const itemToRow = (item) => [
    item.id,
    item.name,
    item.category,
    item.sku,
    item.price,
    item.costPrice,
    item.quantity,
    item.lowStockThreshold,
    item.imageUrl,
    item.profit,
    item.createdAt
];

export const getAllItems = async () => {
    try {
        const sheets = await getGoogleSheetsClient();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: SHEET_RANGE,
        });

        const rows = response.data.values || [];

        // Skip header row and convert to item objects
        return rows.slice(1).map(rowToItem).filter(item => item !== null);
    } catch (error) {
        console.error("Error fetching inventory:", error);
        throw new Error("Failed to fetch inventory");
    }
};

export const saveItem = async (item) => {
    try {
        const sheets = await getGoogleSheetsClient();

        // Add unique ID if new item
        const newItem = {
            ...item,
            id: item.id || uuidv4()
        };

        // Append new row to sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: SHEET_RANGE,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [itemToRow(newItem)]
            }
        });

        return newItem;
    } catch (error) {
        console.error("Error saving item:", error);
        throw new Error("Failed to save item");
    }
};

export const updateItem = async (updatedItem) => {
    try {
        const sheets = await getGoogleSheetsClient();

        // Get all items to find the row number
        const allItems = await getAllItems();
        const itemIndex = allItems.findIndex(item => item.id === updatedItem.id);

        if (itemIndex === -1) {
            throw new Error("Item not found");
        }

        // Row number in sheet (accounting for header row and 0-based index)
        const rowNumber = itemIndex + 2;

        // Update the row
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `Inventory!A${rowNumber}:K${rowNumber}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [itemToRow(updatedItem)]
            }
        });

        return updatedItem;
    } catch (error) {
        console.error("Error updating item:", error);
        throw new Error("Failed to update item");
    }
};

export const deleteItem = async (itemId) => {
    try {
        const sheets = await getGoogleSheetsClient();

        // Get all items to find the row number
        const allItems = await getAllItems();
        const itemIndex = allItems.findIndex(item => item.id === itemId);

        if (itemIndex === -1) {
            throw new Error("Item not found");
        }

        // Row number in sheet (accounting for header row and 0-based index)
        const rowNumber = itemIndex + 2;

        // Delete the row by clearing its content
        // Note: Google Sheets API doesn't have a direct "delete row" method
        // So we'll clear the content and handle it when displaying
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEET_ID,
            range: `Inventory!A${rowNumber}:K${rowNumber}`
        });

        return true;
    } catch (error) {
        console.error("Error deleting item:", error);
        throw new Error("Failed to delete item");
    }
};

// Get items with quantity below their low stock threshold
export const getLowStockItems = async () => {
    const allItems = await getAllItems();
    return allItems.filter(item => item.quantity <= item.lowStockThreshold);
};

// Get sales data summarized by day
export const getSalesData = async (startDate, endDate) => {
    try {
        const sheets = await getGoogleSheetsClient();

        // We'll assume there's a separate Sales sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'Sales!A:F',
        });

        const rows = response.data.values || [];

        // Skip header row
        const sales = rows.slice(1).map(row => ({
            id: row[0],
            itemId: row[1],
            itemName: row[2],
            quantity: parseInt(row[3]),
            total: parseFloat(row[4]),
            profit: parseFloat(row[5]),
            date: new Date(row[6])
        })).filter(sale => {
            if (!startDate || !endDate) return true;

            const saleDate = new Date(sale.date);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
        });

        return sales;
    } catch (error) {
        console.error("Error fetching sales data:", error);
        throw new Error("Failed to fetch sales data");
    }
};