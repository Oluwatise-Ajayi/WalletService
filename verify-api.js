const axios = require('axios');

const API_KEY = 'sk_live_test_key_12345';
const BASE_URL = 'http://localhost:3000';

async function test() {
  try {
    // 1. Get Balance
    console.log('Testing Balance...');
    const balanceRes = await axios.get(`${BASE_URL}/wallet/balance`, {
      headers: { 'x-api-key': API_KEY }
    });
    console.log('Balance:', balanceRes.data);

    // 2. Deposit
    console.log('Testing Deposit...');
    try {
        const depositRes = await axios.post(`${BASE_URL}/wallet/deposit`, { amount: 100 }, {
            headers: { 'x-api-key': API_KEY }
        });
        console.log('Deposit Init:', depositRes.data);

        // 3. Check Status
        if (depositRes.data.reference) {
            const ref = depositRes.data.reference;
            console.log('Testing Deposit Status for:', ref);
            const statusRes = await axios.get(`${BASE_URL}/wallet/deposit/${ref}/status`);
            console.log('Deposit Status:', statusRes.data);
        }
    } catch (e) {
        console.log('Deposit failed:', e.response ? e.response.data : e.message);
    }

  } catch (e) {
    console.error('Test Failed:', e.response ? e.response.data : e.message);
  }
}

test();
