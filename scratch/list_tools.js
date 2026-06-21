const http = require('http');

const authHeader = 'Bearer 8b41d864398a7b33bb0589804424411c15f71edd6902c348711eb306a15f5b64:a6f2cbf5-e946-44d0-acd5-005b2a954e57';
const mcpServerUrl = 'http://localhost:5049/mcp';

async function listMcpTools() {
  return new Promise((resolve, reject) => {
    const sseOptions = {
      hostname: 'localhost',
      port: 5049,
      path: '/mcp',
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    };

    let postUrlString = null;
    let sseId = null;
    const reqId = 1;
    let resolved = false;

    const sseReq = http.request(sseOptions, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to connect to SSE: ${res.statusCode}`));
        return;
      }

      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('event:')) {
            this.currentEvent = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            const data = line.replace('data:', '').trim();
            if (this.currentEvent === 'endpoint') {
              postUrlString = data;
              const match = postUrlString.match(/sseId=([^&]+)/);
              if (match) {
                sseId = match[1];
              }
              sendJsonRpc(postUrlString, 'tools/list', {}, reqId).catch(reject);
            } else if (this.currentEvent === 'message') {
              try {
                const responseObj = JSON.parse(data);
                if (responseObj.id === reqId) {
                  resolved = true;
                  resolve(responseObj.result);
                  sseReq.destroy();
                }
              } catch (err) {
                console.error('Error parsing JSON-RPC response:', err);
              }
            }
          }
        }
      });
    });

    sseReq.on('error', (err) => {
      if (!resolved) reject(err);
    });

    sseReq.end();
  });
}

async function sendJsonRpc(postUrlString, method, params, id) {
  const url = new URL(postUrlString);
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id,
    method,
    params
  });

  const postOptions = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const postReq = http.request(postOptions, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk.toString(); });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`POST failed with ${res.statusCode}: ${responseBody}`));
        } else {
          resolve();
        }
      });
    });

    postReq.on('error', reject);
    postReq.write(payload);
    postReq.end();
  });
}

listMcpTools()
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
