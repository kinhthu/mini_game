const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5049,
  path: '/mcp',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer 8b41d864398a7b33bb0589804424411c15f71edd6902c348711eb306a15f5b64:23ee7f58-dbad-438c-9ef5-bf4264fb2a1e'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
  
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY CHUNK: ${chunk}`);
    // If we receive the endpoint, we can stop or keep reading
    if (chunk.includes('endpoint')) {
        process.exit(0);
    }
  });
  
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
