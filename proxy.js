import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

app.use(cors());

app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://fleet-management-kzif.onrender.com',
    changeOrigin: true,
    secure: false,
    pathRewrite: {
      '^/': '/api/', // Express strips '/api' from the url, so we prepend it back
    },
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] ${req.method} ${proxyReq.path}`);
      },
      error: (err, req, res) => {
        console.error('[PROXY ERROR]', err);
        res.status(500).send('Proxy Error');
      }
    }
  })
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`CORS Proxy server running on http://localhost:${PORT}`);
});
