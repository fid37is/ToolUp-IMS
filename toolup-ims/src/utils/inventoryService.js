// utils/inventoryService.js
const API_URL = '/api/items';

export async function getAllItems() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch items');
    }
    return response.json();
}

export async function saveItem(item) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
    });
    if (!response.ok) {
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
        throw new Error('Failed to update item');
    }
    return response.json();
}

export async function deleteItem(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete item');
    }
    return response.json();
}

export async function getLowStockItems() {
    const items = await getAllItems();
    return items.filter(item => 
        item.quantity <= (item.lowStockThreshold || 5)
    );
}