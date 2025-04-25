// pages/api/inventory.js
export default async function handler(req, res) {
    try {
        const { method } = req;

        switch (method) {
            case 'GET':
                // Get all items logic
                const items = []; // Replace with your actual data fetch
                return res.status(200).json(items);

            case 'POST':
                // Create new item logic
                const newItem = req.body;
                // Save the item
                return res.status(201).json(newItem);

            case 'PUT':
                // Update item logic
                const updatedItem = req.body;
                // Update the item
                return res.status(200).json(updatedItem);

            case 'DELETE':
                // Delete item logic
                const itemId = req.query.id;
                // Use itemId in your delete logic
                console.log(`Deleting item with ID: ${itemId}`);
                return res.status(200).json({ success: true, deletedId: itemId });

            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}