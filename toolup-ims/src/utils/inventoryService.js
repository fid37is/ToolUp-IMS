// in src/utils/inventoryService.js
const API_URL = '/api/items';
const BUSINESS_PREFIX = 'TU'; // Tool Up prefix

// Helper function to generate new item ID
export function generateItemId(existingItems) {
    // Find the highest current number
    const existingIds = existingItems
        .filter(item => item.id && item.id.startsWith(BUSINESS_PREFIX))
        .map(item => {
            const numericPart = item.id.substring(BUSINESS_PREFIX.length);
            return parseInt(numericPart, 10);
        })
        .filter(num => !isNaN(num));

    // Get the highest number or default to 0
    const highestNum = existingIds.length > 0 ? Math.max(...existingIds) : 0;

    // Create new ID with padding zeros (e.g., TU001, TU002, etc.)
    const nextNum = highestNum + 1;
    const paddedNum = String(nextNum).padStart(3, '0');

    return `${BUSINESS_PREFIX}${paddedNum}`;
}

export async function getAllItems() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}): ${errorText}`);
            throw new Error(`Failed to fetch items: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

export async function saveItem(item) {
    // Generate ID if not provided
    if (!item.id) {
        const allItems = await getAllItems();
        item.id = generateItemId(allItems);
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Save Error (${response.status}): ${errorText}`);
        throw new Error('Failed to save item');
    }
    return response.json();
}

export async function updateItem(item) {
    const response = await fetch(`${API_URL}/${item.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Update Error (${response.status}): ${errorText}`);
        throw new Error('Failed to update item');
    }
    return response.json();
}

export async function deleteItem(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            // Try to get error details if available
            let errorDetails = "";
            try {
                const errorData = await response.text();
                errorDetails = errorData;
            } catch {
                errorDetails = response.statusText;
            }
            
            console.error(`Delete Error (${response.status}): ${errorDetails}`);
            throw new Error(`Failed to delete item: ${response.status} ${errorDetails}`);
        }
        
        return response.json();
    } catch (error) {
        console.error("Delete operation failed:", error);
        throw error;
    }
}

export async function getLowStockItems() {
    const items = await getAllItems();
    return items.filter(item =>
        item.quantity <= (item.lowStockThreshold || 5)
    );
}