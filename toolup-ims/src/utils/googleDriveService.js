// utils/googleDriveService.js
import { google } from 'googleapis';

// Set up Google Drive API client
const getGoogleDriveClient = async () => {
    // In a real implementation, you would need to set up OAuth2 authentication
    // or use a service account with proper scopes
    const auth = new google.auth.GoogleAuth({
        // These would come from environment variables in a real app
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/drive']
    });
    const authClient = await auth.getClient();
    return google.drive({ version: 'v3', auth: authClient });
};

export const uploadImage = async (file) => {
    try {
        const drive = await getGoogleDriveClient();

        // Convert file to buffer for upload
        const buffer = await fileToBuffer(file);

        // Upload file to Google Drive
        const response = await drive.files.create({
            requestBody: {
                name: file.name,
                mimeType: file.type,
                // Specify folder ID where images should be stored
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
            },
            media: {
                mimeType: file.type,
                body: buffer
            }
        });

        // Make the file publicly accessible for viewing
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        // Get the web view link
        const fileData = await drive.files.get({
            fileId: response.data.id,
            fields: 'webViewLink, webContentLink'
        });

        // Return the public URL
        return fileData.data.webContentLink;
    } catch (error) {
        console.error("Error uploading to Google Drive:", error);
        throw new Error("Failed to upload image");
    }
};

// Helper function to convert File object to buffer
const fileToBuffer = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(Buffer.from(reader.result));
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};