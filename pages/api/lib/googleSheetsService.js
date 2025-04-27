// pages/api/lib/googleSheetsService.js
import { google } from 'googleapis';
import path from 'path';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const INVENTORY_SHEET_RANGE = 'Inventory!A:J';

export const getGoogleSheetsClient = async () => {
    try {
        const keyFilePath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const authClient = await auth.getClient();
        return google.sheets({ version: 'v4', auth: authClient });
    } catch (error) {
        console.error('Error creating Google Sheets client:', error);
        throw error;
    }
};

export async function getAllItemsFromSheets() {
    try {
        const sheets = await getGoogleSheetsClient();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: INVENTORY_SHEET_RANGE,
        });

        const rows = response.data.values || [];

        // Initialize the sheet with headers if it's empty
        if (rows.length === 0) {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: INVENTORY_SHEET_RANGE,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [['id', 'name', 'category', 'sku', 'price', 'costPrice', 'quantity', 'lowStockThreshold', 'imageUrl', 'profit']]
                }
            });
            return [];
        }

        // Skip header row
        const startIndex = rows[0][0] === 'id' ? 1 : 0;

        if (rows.length <= startIndex) {
            return [];
        }

        return rows.slice(startIndex).map(row => ({
            id: row[0],
            name: row[1],
            category: row[2] || '',
            sku: row[3] || '',
            price: parseFloat(row[4] || 0),
            costPrice: parseFloat(row[5] || 0),
            quantity: parseInt(row[6] || 0),
            lowStockThreshold: parseInt(row[7] || 5),
            imageUrl: row[8] || '',
            profit: parseFloat(row[9] || 0)
        }));
    } catch (error) {
        console.error('Error fetching items from Google Sheets:', error);
        throw error;
    }
}

export async function saveItemToSheets(item) {
    try {
        const sheets = await getGoogleSheetsClient();

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: INVENTORY_SHEET_RANGE,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    item.id,
                    item.name,
                    item.category || '',
                    item.sku || '',
                    item.price || 0,
                    item.costPrice || 0,
                    item.quantity || 0,
                    item.lowStockThreshold || 5,
                    item.imageUrl || '',
                    item.profit || 0
                ]]
            }
        });

        return item;
    } catch (error) {
        console.error('Error saving item to Google Sheets:', error);
        throw error;
    }
}

export async function updateItemInSheets(item) {
    try {
        const sheets = await getGoogleSheetsClient();

        // First, get all items to find the row index
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: INVENTORY_SHEET_RANGE,
        });

        const rows = response.data.values || [];
        let rowIndex = rows.findIndex(row => row[0] === item.id);

        if (rowIndex === -1) {
            console.log(`Item with ID ${item.id} not found, adding instead of updating`);
            return saveItemToSheets(item);
        }

        // Update the row
        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `Inventory!A${rowIndex + 1}:J${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    item.id,
                    item.name,
                    item.category || '',
                    item.sku || '',
                    item.price || 0,
                    item.costPrice || 0,
                    item.quantity || 0,
                    item.lowStockThreshold || 5,
                    item.imageUrl || '',
                    item.profit || 0
                ]]
            }
        });

        return item;
    } catch (error) {
        console.error('Error updating item in Google Sheets:', error);
        throw error;
    }
}

export async function deleteItemFromSheets(id) {
    try {
        const sheets = await getGoogleSheetsClient();

        // First, get all items to find the row index
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: INVENTORY_SHEET_RANGE,
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            throw new Error(`Item with ID ${id} not found`);
        }

        // Delete the row by clearing its contents and then removing it
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEET_ID,
            range: `Inventory!A${rowIndex + 1}:J${rowIndex + 1}`,
        });

        // You may also want to implement actual row deletion if your Google Sheets API version supports it

        return { id };
    } catch (error) {
        console.error('Error deleting item from Google Sheets:', error);
        throw error;
    }
}