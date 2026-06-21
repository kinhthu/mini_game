const { callMcpTool } = require('../mcp_call.js');
const fs = require('fs');
const path = require('path');

const toolName = process.argv[2];
const jsonPath = process.argv[3];

if (!toolName) {
  console.error("Missing tool name");
  process.exit(1);
}

let args = {};
if (jsonPath) {
  const absolutePath = path.resolve(jsonPath);
  const data = fs.readFileSync(absolutePath, 'utf8');
  args = JSON.parse(data);
}

callMcpTool(toolName, args)
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
