// api/nasa-apod.js
  // Vercel Serverless Function for NASA APOD API

  export default async function handler(req, res) {
    // 只允許 GET 請求
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // 從環境變數中讀取 API key（這樣 key 就不會暴露在程式碼中）
      const NASA_API_KEY = process.env.NASA_API_KEY;

      if (!NASA_API_KEY) {
        return res.status(500).json({ error: 'NASA API key not configured' });
      }

      // 從前端接收日期參數
      const { date } = req.query;

      // 建立 NASA API URL
      let apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

      // 如果有指定日期，加入 date 參數
      if (date) {
        apiUrl += `&date=${date}`;
      }

      // 呼叫 NASA API
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`NASA API error: ${response.status}`);
      }

      const data = await response.json();

      // 設定 CORS headers（允許你的網站呼叫這個 API）
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');

      // 回傳資料給前端
      return res.status(200).json(data);

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch APOD data',
        message: error.message
      });
    }
  }