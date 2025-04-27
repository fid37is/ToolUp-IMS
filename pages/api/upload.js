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
        // Create a new formidable form
        const form = formidable({
            keepExtensions: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB limit
        });

        // Parse the form
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) return reject(err);
                resolve([fields, files]);
            });
        });

        // Log what we received to help diagnose issues
        console.log('Form fields received:', Object.keys(fields));
        console.log('Files received:', Object.keys(files));
        
        // Get the uploaded file - look for 'image' field name to match the client-side
        const file = files.image ? 
            (Array.isArray(files.image) ? files.image[0] : files.image) : null;

        if (!file) {
            return res.status(400).json({ 
                message: 'No file uploaded', 
                receivedFields: Object.keys(fields),
                receivedFiles: Object.keys(files)
            });
        }

        console.log('File details:', {
            name: file.originalFilename,
            type: file.mimetype,
            size: file.size,
            path: file.filepath
        });

        // Inside your handler:
        const keyPath = path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);

        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        const fileMetadata = {
            name: file.originalFilename || 'uploaded-image',
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] // Add your folder ID
        };

        const media = {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.filepath)
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

        // Clean up the temporary file
        try {
            fs.unlinkSync(file.filepath);
        } catch (e) {
            console.error('Error removing temp file:', e);
        }

        res.status(200).json({
            success: true,
            imageUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
}