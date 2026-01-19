// Simple serverless function for Vercel
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.status(200).json({
      status: 'ok',
      message: 'Cedra Quest Backend is running',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // For now, return a simple response for all other routes
  res.status(200).json({
    message: 'Cedra Quest Backend API',
    path: req.url,
    method: req.method,
  });
};