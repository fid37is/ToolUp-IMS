// utils/googleSheetsService.js
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const ITEMS_RANGE = 'Inventory!A:J'; // Adjust based on your sheet layout

export async function getGoogleSheetsClient() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const authClient = await auth.getClient();
        return google.sheets({ version: 'v4', auth: authClient });
    } catch (error) {
        console.error("Error getting Google Sheets client:", error);
        throw error;
    }
}

export async function getAllItemsFromSheet() {
    try {
        const sheets = await getGoogleSheetsClient();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: ITEMS_RANGE,
        });
        
        const rows = response.data.values || [];
        if (rows.length <= 1) return []; // Only header or empty
        
        // Assuming first row is header: id, name, category, sku, price, costPrice, quantity, lowStockThreshold, imageUrl
        const headers = rows[0];
        
        // Map the rows to objects
        return rows.slice(1).map(row => {
            const item = {};
            headers.forEach((header, index) => {
                // Convert numeric values
                if (['price', 'costPrice'].includes(header)) {
                    item[header] = parseFloat(row[index] || '0');
                } else if (['quantity', 'lowStockThreshold'].includes(header)) {
                    item[header] = parseInt(row[index] || '0', 10);
                } else {
                    item[header] = row[index] || '';
                }
            });
            return item;
        });
    } catch (error) {
        console.error("Error getting items from sheet:", error);
        throw error;
    }
}

export async function saveItemToSheet(item) {
    try {
        const sheets = await getGoogleSheetsClient();
        
        // Generate an ID if not provided
        const itemWithId = {
            id: item.id || uuidv4(),
            ...item
        };
        
        // Get headers first to ensure correct column order
        const headerResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: `${ITEMS_RANGE.split('!')[0]}!1:1`,
        });
        
        const headers = headerResponse.data.values[0] || [
            'id', 'name', 'category', 'sku', 'price', 'costPrice', 
            'quantity', 'lowStockThreshold', 'imageUrl'
        ];
        
        // Prepare row data according to headers
        const rowData = headers.map(header => itemWithId[header] || '');
        
        // Append the new item
        sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: ITEMS_RANGE,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [rowData]
            }
        });
        
        return itemWithId;
    } catch (error) {
        console.error("Error saving item to sheet:", error);
        throw error;
    }
}

export async function updateItemInSheet(item) {
    try {
        const sheets = await getGoogleSheetsClient();
        
        // Get all items to find the row index
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: ITEMS_RANGE,
        });
        
        const rows = response.data.values || [];
        const headers = rows[0];
        const rowIndex = rows.findIndex((row, index) => 
            index > 0 && row[0] === item.id
        );
        
        if (rowIndex === -1) {
            throw new Error(`Item with ID ${item.id} not found`);
        }
        
        // Prepare row data according to headers
        const rowData = headers.map(header => item[header] !== undefined ? item[header] : '');
        
        // Update the item
        sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${ITEMS_RANGE.split('!')[0]}!${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [rowData]
            }
        });
        
        return item;
    } catch (error) {
        console.error("Error updating item in sheet:", error);
        throw error;
    }
}

export async function deleteItemFromSheet(id) {
    try {
        const sheets = await getGoogleSheetsClient();
        
        // Get all items to find the row index
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: ITEMS_RANGE,
        });
        
        const rows = response.data.values || [];
        const rowIndex = rows.findIndex((row, index) => 
            index > 0 && row[0] === id
        );
        
        if (rowIndex === -1) {
            throw new Error(`Item with ID ${id} not found`);
        }
        
        // Delete the row (by clearing it - Sheets API doesn't have direct delete)
        const sheetName = ITEMS_RANGE.split('!')[0];
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEET_ID,
            range: `${sheetName}!A${rowIndex + 1}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 1}`,
        });
        
        return { id, deleted: true };
    } catch (error) {
        console.error("Error deleting item from sheet:", error);
        throw error;
    }
}