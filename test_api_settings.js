const http = require('http');

const data = JSON.stringify({
    hourlyRate: 200,
    halfDayPrice: 3000,
    fullDayPrice: 6000
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/settings/pricing',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();
