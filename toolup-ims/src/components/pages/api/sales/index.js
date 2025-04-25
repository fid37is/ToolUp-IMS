// pages/api/sales/index.js
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { updateItem } from '../../../utils/inventoryService';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = 'Sales!A:G';

const getGoogleSheetsClient = async () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
};

export default async function handler(req, res) {
    try {
        if (req.method === 'POST') {
            const { item, quantity, date = new Date().toISOString() } = req.body;

            if (!item || !quantity) {
                return res.status(400).json({ message: 'Item and quantity are required' });
            }

            const totalAmount = item.price * quantity;
            const profit = (item.price - item.costPrice) * quantity;

            const sheets = await getGoogleSheetsClient();

            // Record the sale
            const saleId = uuidv4();
            await sheets.spreadsheets.values.append({
                spreadsheetId: SHEET_ID,
                range: SHEET_RANGE,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[
                        saleId,
                        item.id,
                        item.name,
                        quantity,
                        totalAmount,
                        profit,
                        date
                    ]]
                }
            });

            // Update the item's quantity and profit
            const updatedItem = {
                ...item,
                quantity: item.quantity - quantity,
                profit: (item.profit || 0) + profit
            };

            await updateItem(updatedItem);

            return res.status(201).json({
                id: saleId,
                item: updatedItem,
                quantity,
                totalAmount,
                profit,
                date
            });
        } else if (req.method === 'GET') {
            const { startDate, endDate } = req.query;

            const sheets = await getGoogleSheetsClient();

            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: SHEET_RANGE,
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
                date: row[6]
            })).filter(sale => {
                if (!startDate || !endDate) return true;

                const saleDate = new Date(sale.date);
                return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
            });

            return res.status(200).json(sales);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ message: error.message });
    }
}