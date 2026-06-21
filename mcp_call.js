const http = require('http');
const url = require('url');

const AUTH_HEADER = 'Bearer 8b41d864398a7b33bb0589804424411c15f71edd6902c348711eb306a15f5b64:23ee7f58-dbad-438c-9ef5-bf4264fb2a1e';
const BASE_URL = 'http://localhost:5049/mcp';

const method = process.argv[2] || 'tools/list';
const payloadArg = process.argv[3] || '{}';

let params = {};
try {
  params = JSON.parse(payloadArg);
} catch (e) {
  console.error("Invalid JSON arguments:", e.message);
  process.exit(1);
}

// JSON-RPC Request object
const requestId = Math.floor(Math.random() * 1000000);
const jsonRpcRequest = {
  jsonrpc: '2.0',
  id: requestId,
  method: method,
  params: params
};

// Establish SSE connection
const parsedBase = url.parse(BASE_URL);
const sseOptions = {
  hostname: parsedBase.hostname,
  port: parsedBase.port,
  path: parsedBase.path,
  method: 'GET',
  headers: {
    'Authorization': AUTH_HEADER,
    'Accept': 'text/event-stream'
  }
};

let postUrlString = null;
let sseResponse = null;

const sseReq = http.request(sseOptions, (res) => {
  sseResponse = res;
  let buffer = '';
  
  res.on('data', (chunk) => {
    buffer += chunk.toString();
    processBuffer();
  });

  function processBuffer() {
    let lines = buffer.split('\n');
    buffer = lines.pop(); // Keep last incomplete line

    let currentEvent = null;
    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('event:')) {
        currentEvent = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        const dataStr = line.substring(5).trim();
        handleEvent(currentEvent, dataStr);
        currentEvent = null;
      }
    }
  }
});

function handleEvent(event, data) {
  if (event === 'endpoint') {
    postUrlString = data;
    // Send the JSON-RPC request once endpoint is received
    sendJsonRpc();
  } else if (event === 'message') {
    try {
      const response = JSON.parse(data);
      if (response.id === requestId) {
        console.log(JSON.stringify(response, null, 2));
        cleanupAndExit(0);
      } else {
        // Log other messages (like notifications or other responses) to stderr
        // console.error("Received other message:", response);
      }
    } catch (e) {
      console.error("Failed to parse event message JSON:", e.message, data);
    }
  }
}

function sendJsonRpc() {
  const parsedPost = url.parse(postUrlString);
  const postData = JSON.stringify(jsonRpcRequest);

  const postOptions = {
    hostname: parsedPost.hostname,
    port: parsedPost.port,
    path: parsedPost.path + (parsedPost.search || ''),
    method: 'POST',
    headers: {
      'Authorization': AUTH_HEADER,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const postReq = http.request(postOptions, (res) => {
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    res.on('end', () => {
      // Some SSE servers might return the response directly in the POST response
      if (responseData.trim().length > 0) {
        try {
          const response = JSON.parse(responseData);
          if (response.id === requestId) {
            console.log(JSON.stringify(response, null, 2));
            cleanupAndExit(0);
          }
        } catch (e) {
          // Not JSON or different ID, wait for SSE
        }
      }
    });
  });

  postReq.on('error', (e) => {
    console.error(`POST request failed: ${e.message}`);
    cleanupAndExit(1);
  });

  postReq.write(postData);
  postReq.end();
}

function cleanupAndExit(code) {
  if (sseResponse) {
    sseResponse.destroy();
  }
  process.exit(code);
}

sseReq.on('error', (e) => {
  console.error(`SSE connection failed: ${e.message}`);
  process.exit(1);
});

sseReq.end();
