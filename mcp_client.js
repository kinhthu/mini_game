const http = require('http');
const url = require('url');

const toolName = process.argv[2];
const toolArgsStr = process.argv[3] || '{}';
let toolArgs = {};
if (toolArgsStr.endsWith('.json')) {
  const fs = require('fs');
  try {
    const fileContent = fs.readFileSync(toolArgsStr, 'utf8');
    toolArgs = JSON.parse(fileContent);
  } catch (e) {
    console.error('Failed to read/parse arguments from file:', e.message);
    process.exit(1);
  }
} else {
  try {
    toolArgs = JSON.parse(toolArgsStr);
  } catch (e) {
    console.error('Invalid arguments JSON:', e.message);
    process.exit(1);
  }
}

if (!toolName) {
  console.error('Usage: node mcp_client.js <tool_name> [args_json_string]');
  process.exit(1);
}

const authHeader = 'Bearer 8b41d864398a7b33bb0589804424411c15f71edd6902c348711eb306a15f5b64:6c2a78a1-ed48-4120-8e15-bd142df3bcce';

function postJson(targetUrl, bodyObj) {
  const parsed = url.parse(targetUrl);
  const bodyStr = JSON.stringify(bodyObj);
  
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Authorization': authHeader
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`POST failed with status ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// Timeout guard
const timeout = setTimeout(() => {
  console.error('Timeout waiting for MCP response');
  process.exit(1);
}, 10000);

const sseReq = http.get('http://localhost:5049/mcp', {
  headers: {
    'Authorization': authHeader
  }
}, (res) => {
  if (res.statusCode !== 200) {
    console.error(`SSE connection failed with status ${res.statusCode}`);
    process.exit(1);
  }

  let buffer = '';
  res.on('data', async (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    
    for (let line of lines) {
      if (line.trim().startsWith('data:')) {
        const endpoint = line.trim().slice(5).trim();
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
          // Found endpoint! Close SSE request.
          sseReq.destroy();
          
          // Call tool directly
          try {
            const responseBody = await postJson(endpoint, {
              jsonrpc: '2.0',
              id: 1,
              method: 'tools/call',
              params: {
                name: toolName,
                arguments: toolArgs
              }
            });
            
            const responseObj = JSON.parse(responseBody);
            clearTimeout(timeout);
            if (responseObj.error) {
              console.error('MCP Error:', JSON.stringify(responseObj.error, null, 2));
              process.exit(1);
            } else {
              // Print only the content text for easier consumption
              const textContent = responseObj.result?.content?.[0]?.text;
              if (textContent) {
                console.log(textContent);
              } else {
                console.log(JSON.stringify(responseObj.result, null, 2));
              }
              process.exit(0);
            }
          } catch (err) {
            console.error('HTTP POST request failed:', err.message);
            process.exit(1);
          }
        }
      }
    }
  });
});

sseReq.on('error', (err) => {
  console.error('SSE connection error:', err);
  process.exit(1);
});
