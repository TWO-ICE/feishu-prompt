const axios = require('axios');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 获取请求路径（去除/api/proxy前缀）
    const path = req.url.replace(/^\/api\/proxy/, '');
    const targetUrl = `https://open.feishu.cn${path}`;
    
    // 准备请求配置
    const config = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: 'open.feishu.cn',
        origin: 'https://open.feishu.cn'
      }
    };
    
    // 如果有请求体，添加到配置中
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      config.data = req.body;
    }
    
    // 发送请求到飞书API
    const response = await axios(config);
    
    // 返回响应
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('代理请求错误:', error);
    return res.status(error.response?.status || 500).json({
      error: '代理请求错误',
      message: error.message
    });
  }
};