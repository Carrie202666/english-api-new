export default async function handler(req, res) {
  // 设置 CORS 头（允许小程序调用）
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

  // 验证参数
  if (!chinese || !userEnglish) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      message: 'Please provide both "chinese" and "userEnglish" in the request body.'
    });
  }

  // 获取 DeepSeek API Key
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

  // 如果没有配置 API Key，返回测试模式响应
  if (!DEEPSEEK_API_KEY) {
    return res.status(200).json({ 
      success: true, 
      mode: 'test',
      feedback: `⚠️ 测试模式（未配置 DeepSeek API Key）\n\n中文：${chinese}\n你的英文：${userEnglish}\n\n请在 Vercel 环境变量中添加 DEEPSEEK_API_KEY 以启用 AI 评判。`,
      debug: { chinese, userEnglish }
    });
  }

  // DeepSeek 的系统提示词
  const systemPrompt = `你是一个英语教学专家。用户的英文翻译可能不完全和标准答案一样，你需要判断是否正确、是否地道自然。

判断标准：
1. 如果翻译正确且自然：返回 "✅ 正确且自然"
2. 如果正确但不够地道：返回 "⚠️ 正确但不够地道，更自然的说法是：[更好的表达]"
3. 如果错误：返回 "❌ 错误，正确说法是：[正确翻译]，原因是：[简短解释]"

只返回上面的反馈文字，不要加其他内容。`;

  const userPrompt = `中文句子：${chinese}\n用户的英文翻译：${userEnglish}`;

  try {
    // 调用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const data = await response.json();

    // 检查 API 调用是否成功
    if (!response.ok) {
      console.error('DeepSeek API error:', data);
      return res.status(500).json({ 
        success: false, 
        error: 'AI service error',
        message: data.error?.message || 'Unknown error'
      });
    }

    const feedback = data.choices[0].message.content;
    
    return res.status(200).json({ 
      success: true, 
      mode: 'ai',
      feedback: feedback
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: error.message 
    });
  }
}
