const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/proxy',
    createProxyMiddleware({
      target: 'https://open.feishu.cn',
      changeOrigin: true,
      pathRewrite: {
        '^/api/proxy': ''
      },
      onProxyReq: function(proxyReq, req, res) {
        // 确保请求头正确传递
        if (req.headers.origin) {
          proxyReq.setHeader('origin', 'https://open.feishu.cn');
        }
      },
      onProxyRes: function(proxyRes, req, res) {
        // 添加CORS头
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Max-Age'] = '86400';
      },
      // 处理OPTIONS预检请求
      onProxyOptions: function(proxyReq, req, res) {
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Access-Control-Max-Age', '86400');
          res.end();
          return true;
        }
        return false;
      },
      // 添加错误处理
      onError: function(err, req, res) {
        console.error('代理请求错误:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain'
        });
        res.end('代理请求错误: ' + err);
      }
    })
  );
};