// pages/api/upload.js
import { uploadImage } from '../../utils/googleDriveService';
import formidable from 'formidable';
import fs from 'fs';

// Disable default body parser for file uploads
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
        const form = new formidable.IncomingForm();

        // Use array destructuring with only the second element
        const files = await new Promise((resolve, reject) => {
            form.parse(req, (err, _fields, files) => {
                if (err) reject(err);
                resolve(files);
            });
        });

        const file = files.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Convert to File-like object for Google Drive service
        const fileData = {
            name: file.originalFilename,
            type: file.mimetype,
            size: file.size,
        };

        // Read file into buffer
        const buffer = fs.readFileSync(file.filepath);

        // We need to adapt our uploadImage function to work with Node.js Buffer
        // instead of browser File object
        const url = await uploadImage({ ...fileData, buffer });

        return res.status(200).json({ url });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
}