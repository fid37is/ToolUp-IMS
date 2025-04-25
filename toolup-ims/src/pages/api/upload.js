// pages/api/upload.js
import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Get file from request
        const file = req.body.file;

        // Set up auth
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/drive']
        });

        const authClient = await auth.getClient();
        const drive = google.drive({ version: 'v3', auth: authClient });

        // Upload to Google Drive
        const response = await drive.files.create({
            requestBody: {
                name: file.name,
                mimeType: file.type,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
            },
            media: {
                mimeType: file.type,
                body: file.buffer
            }
        });

        // Make it public
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        // Get web link
        const fileData = await drive.files.get({
            fileId: response.data.id,
            fields: 'webViewLink, webContentLink'
        });

        return res.status(200).json({ url: fileData.data.webContentLink });
    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        return res.status(500).json({ error: 'Failed to upload image' });
    }
}