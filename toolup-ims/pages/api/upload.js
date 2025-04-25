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

    console.log("Upload API called");

    try {
        // Parse the form using formidable
        const form = new formidable.IncomingForm();
        form.keepExtensions = true;
        console.log("Parsing form data");

        const [, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.error("Form parsing error:", err);
                    reject(err);
                }
                resolve([fields, files]);
            });
        });

        console.log("Form parsed, files:", Object.keys(files));

        // Fix for formidable v4+: Get the first file regardless of field name
        let file;
        if (Array.isArray(files.file)) {
            // If it's an array (multiple files with same field name)
            file = files.file[0];
        } else if (files.file) {
            // If it's a single file with expected field name
            file = files.file;
        } else {
            // Fallback: Get the first file from any field
            const fileKey = Object.keys(files)[0];
            file = Array.isArray(files[fileKey]) ? files[fileKey][0] : files[fileKey];
        }

        if (!file) {
            console.error("No file found in the request");
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log("File details:", {
            name: file.originalFilename || file.newFilename,
            type: file.mimetype,
            size: file.size,
            path: file.filepath
        });

        // Set up auth
        console.log("Setting up Google auth");
        const keyFilePath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/drive']
        });

        console.log("Getting auth client");
        const authClient = await auth.getClient();
        const drive = google.drive({ version: 'v3', auth: authClient });

        // Read the file content
        console.log("Reading file content");
        const fileContent = fs.readFileSync(file.filepath);

        // Upload to Google Drive
        console.log("Uploading to Google Drive");
        const response = await drive.files.create({
            requestBody: {
                name: file.originalFilename || file.newFilename || 'uploaded-file',
                mimeType: file.mimetype,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
            },
            media: {
                mimeType: file.mimetype,
                body: fileContent
            }
        });

        console.log("Upload successful, file ID:", response.data.id);

        // Make it public
        console.log("Setting file permissions");
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        // Get web link
        console.log("Getting file link");
        const fileData = await drive.files.get({
            fileId: response.data.id,
            fields: 'webViewLink, webContentLink'
        });

        console.log("Success, returning URL");
        return res.status(200).json({ url: fileData.data.webContentLink });
    } catch (error) {
        console.error('Error in upload API:', error);
        // Return detailed error info
        return res.status(500).json({
            error: 'Failed to upload image',
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}