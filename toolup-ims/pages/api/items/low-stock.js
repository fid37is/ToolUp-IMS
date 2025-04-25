
// pages/api/items/low-stock.js
import { getLowStockItems } from '../../../src/utils/inventoryService';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const items = await getLowStockItems();
            return res.status(200).json(items);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ message: error.message });
    }
}