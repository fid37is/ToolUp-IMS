// pages/api/items/[id].js
import { updateItemInSheet, deleteItemFromSheet } from '../../../src/utils/googleSheetsService';

export default async function handler(req, res) {
    const { id } = req.query;

    try {
        if (req.method === 'PUT') {
            const updatedItem = req.body;
            const result = await updateItemInSheet({ ...updatedItem, id });
            return res.status(200).json(result);
        } else if (req.method === 'DELETE') {
            // Pass req.headers if deleteItemFromSheet needs headers
            const result = await deleteItemFromSheet(id, req.headers);
            return res.status(200).json(result);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ message: error.message });
    }
}