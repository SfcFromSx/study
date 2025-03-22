/**
 * Simple HTTP server for the Space Quiz Shooter game
 * 
 * To run:
 * 1. Install Node.js if you don't have it already
 * 2. Navigate to the game directory in terminal/command prompt
 * 3. Run: node server.js
 * 4. Open your browser and go to http://localhost:8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Parse URL to get the path
    let filePath = req.url;
    
    // Default to index.html for root path
    if (filePath === '/' || filePath === '') {
        filePath = '/index.html';
    }
    
    // Get the absolute path
    const absPath = path.join(__dirname, filePath);
    
    // Get file extension
    const ext = path.extname(absPath).toLowerCase();
    
    // Check if the file exists
    fs.access(absPath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        
        // Get the MIME type
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        // Read and serve the file
        fs.readFile(absPath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server.');
}); 