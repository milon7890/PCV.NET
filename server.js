const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 8096;
const BASE_URL = 'http://172.16.200.100';

app.use(express.json());
app.use(express.static('public'));

// Simulated Database
const db = {
    users: [
        { id: 1, username: 'admin', role: 'ADMIN' },
        { id: 2, username: 'user', role: 'PCV.NET' }
    ],
    movies: [
        { id: 1, title: "Sample Movie", trailer: "trailer1.mp4", file: "movie1.mp4", poster: "https://via.placeholder.com/300x450" },
        // Add more movie objects here
    ]
};

// Middleware for User Role UI Logic (Sent to Frontend)
app.get('/api/config', (req, res) => {
    // In a real app, this would check session/token
    const userRole = req.query.role === 'admin' ? 'ADMIN' : 'PCV.NET';
    res.json({ role: userRole, baseUrl: BASE_URL });
});

app.get('/api/movies', (req, res) => res.json(db.movies));

// Streaming & Download Route
app.get('/stream/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'movies', req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});

app.listen(PORT, '172.16.200.100', () => {
    console.log(`PCV.NET Server running at ${BASE_URL}`);
});