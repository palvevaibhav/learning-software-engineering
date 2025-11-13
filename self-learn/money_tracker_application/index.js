const http = require("http");

const server = http.createServer((req, res) =>{
    req.method === 'GET' && req.url === '/' ? res.end('Welcome to Money Tracker Application!') : res.end('Not Found');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

