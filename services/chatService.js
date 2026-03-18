// services/chatService.js
const KAGGLE_API_URL = 'https://large-masks-try.loca.lt'; // Get this from LocalTunnel

export const chatWithRafiki = async (message) => {
  try {
    console.log('📤 Sending to Rafiki API:', message);
    
    const response = await fetch(`${KAGGLE_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('📨 Received from API:', data);
    
    return data;
    
  } catch (error) {
    console.error('API connection error:', error);
    return {
      success: false,
      response: null,
      error: error.message
    };
  }
};

// Test connection
export const testConnection = async () => {
  try {
    const response = await fetch(`${KAGGLE_API_URL}/health`);
    const data = await response.json();
    return data;
  } catch (error) {
    return { 
      status: 'error', 
      error: 'Cannot connect to Rafiki API. Make sure your Kaggle server is running.' 
    };
  }
};