export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  const { chinese, userEnglish } = req.body;

  if (!chinese || !userEnglish) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      message: 'Please provide both "chinese" and "userEnglish" in the request body.'
    });
  }

  // 先返回一个测试响应，稍后配置 DeepSeek
  return res.status(200).json({ 
    success: true, 
    message: 'API is working!',
    feedback: `✅ 收到你的翻译请求！\n中文：${chinese}\n你的英文：${userEnglish}\n\n（接下来需要配置 DeepSeek API Key）`,
    debug: {
      chinese: chinese,
      userEnglish: userEnglish
    }
  });
}
