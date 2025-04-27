// pages/api/upload.js
import { google } from 'googleapis';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Disable the default body parser to handle form data
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Parse form with formidable - FIXED
        const form = new formidable.IncomingForm();
        const { files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve({ fields, files });
            });
        });

        // Make sure file exists
        if (!files.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Inside your handler:
        const keyPath = path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);

        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        const fileMetadata = {
            name: files.file.originalFilename || 'uploaded-image',
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] // Add your folder ID
        };

        const media = {
            mimeType: files.file.mimetype,
            body: fs.createReadStream(files.file.filepath)
        };

        const driveResponse = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id,webViewLink'
        });

        // Set the file to be publicly accessible
        await drive.permissions.create({
            fileId: driveResponse.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        // Get the actual download URL
        const imageUrl = `https://drive.google.com/uc?export=view&id=${driveResponse.data.id}`;

        res.status(200).json({
            success: true,
            imageUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
}