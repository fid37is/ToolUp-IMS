// pages/api/inventory.js
import { v4 as uuidv4 } from 'uuid';
import {
    getAllItemsFromSheets,
    saveItemToSheets,
    updateItemInSheets,
    deleteItemFromSheets
} from './lib/googleSheetsService';

export default async function handler(req, res) {
    try {
        // GET - Fetch all items
        if (req.method === 'GET') {
            const items = await getAllItemsFromSheets();
            return res.status(200).json(items);
        }

        // POST - Add new item
        else if (req.method === 'POST') {
            const newItem = {
                ...req.body,
                id: req.body.id || uuidv4()
            };
            const savedItem = await saveItemToSheets(newItem);
            return res.status(201).json(savedItem);
        }

        // PUT - Update existing item
        else if (req.method === 'PUT') {
            const updatedItem = req.body;
            const result = await updateItemInSheets(updatedItem);
            return res.status(200).json(result);
        }

        // DELETE - Remove an item
        else if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ message: 'Item ID is required' });
            }
            await deleteItemFromSheets(id);
            return res.status(200).json({ message: 'Item deleted successfully', id });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('Inventory API error:', error);
        return res.status(500).json({ message: error.message });
    }
}