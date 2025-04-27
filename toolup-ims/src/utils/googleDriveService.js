// utils/googleDriveService.js (client-side version)
export async function uploadImage(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Upload failed: ${error}`);
        }

        const data = await response.json();
        return data.imageUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}