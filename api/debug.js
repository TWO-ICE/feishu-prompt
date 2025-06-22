const axios = require('axios');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 返回环境变量状态（不返回实际值，只返回是否设置）
  const envStatus = {
    APP_ID: process.env.REACT_APP_FEISHU_APP_ID ? '已设置' : '未设置',
    APP_SECRET: process.env.REACT_APP_FEISHU_APP_SECRET ? '已设置' : '未设置',
    APP_TOKEN: process.env.REACT_APP_FEISHU_APP_TOKEN ? '已设置' : '未设置',
    TABLE_ID: process.env.REACT_APP_FEISHU_TABLE_ID ? '已设置' : '未设置',
    ADMIN_PASSWORD: process.env.REACT_APP_ADMIN_PASSWORD ? '已设置' : '未设置',
    NODE_ENV: process.env.NODE_ENV || '未设置'
  };

  // 返回响应
  return res.status(200).json({
    message: '环境变量状态',
    env: envStatus,
    timestamp: new Date().toISOString()
  });
};