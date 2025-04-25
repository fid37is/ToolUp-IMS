// utils/googleDriveService.js
export const uploadImage = async (file) => {
    try {
        // Create FormData to send file
        const formData = new FormData();
        formData.append('file', file);

        // Send to your API route
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error("Error uploading to Google Drive:", error);
        throw new Error("Failed to upload image");
    }
};