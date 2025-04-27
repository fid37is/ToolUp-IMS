// src/utils/googleDriveService.js

export const uploadImage = async (file) => {
    if (!file) {
        throw new Error("No file provided");
    }

    console.log("Uploading file:", file.name, "size:", file.size); // Debug logging

    const formData = new FormData();
    formData.append('image', file); // This name must match what the server expects

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.imageUrl;
};