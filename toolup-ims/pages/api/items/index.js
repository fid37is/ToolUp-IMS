// pages/api/items/index.js
import { getAllItemsFromSheet, saveItemToSheet } from '../../../utils/googleSheetsService';

export default async function handler(req, res) {
    console.log('API endpoint called with method:', req.method);
    
    try {
        // Rest of your handler code...
    } catch (error) {
        console.error('API error details:', error);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({ 
            message: error.message,
            details: error.stack
        });
    }
}

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const items = await getAllItemsFromSheet();
            return res.status(200).json(items);
        } else if (req.method === 'POST') {
            const newItem = req.body;
            
            if (!newItem.name) {
                return res.status(400).json({ message: 'Item name is required' });
            }
            
            const savedItem = await saveItemToSheet(newItem);
            return res.status(201).json(savedItem);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ message: error.message });
    }
}