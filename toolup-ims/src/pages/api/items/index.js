// pages/api/items/index.js
import { getAllItems, saveItem } from '../../../utils/inventoryService';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const items = await getAllItems();
            return res.status(200).json(items);
        } else if (req.method === 'POST') {
            const newItem = req.body;
            const savedItem = await saveItem(newItem);
            return res.status(201).json(savedItem);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// pages/api/items/[id].js
import { updateItem, deleteItem } from '../../../utils/inventoryService';

export default async function handler(req, res) {
    const { id } = req.query;

    try {
        if (req.method === 'PUT') {
            const updatedItem = req.body;
            const result = await updateItem({ ...updatedItem, id });
            return res.status(200).json(result);
        } else if (req.method === 'DELETE') {
            await deleteItem(id);
            return res.status(200).json({ message: 'Item deleted' });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// pages/api/items/low-stock.js
import { getLowStockItems } from '../../../utils/inventoryService';

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