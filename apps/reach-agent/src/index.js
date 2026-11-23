// ReachAgent — 全模態網際網路抓取管線
import http from 'node:http';

const port = Number(process.env.REACH_AGENT_PORT || 8999);

http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ name: 'ReachAgent', version: '1.0.0', port }));
}).listen(port, () => console.log(`ReachAgent listening on ${port}`));
