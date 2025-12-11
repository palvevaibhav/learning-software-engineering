const { createServer } = require('http');
const fs = require('fs');

createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });

        const readStream = fs.createReadStream('sample.txt');
        readStream.pipe(res);

        readStream.on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error reading file');
            console.error(err);
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
}).listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});
