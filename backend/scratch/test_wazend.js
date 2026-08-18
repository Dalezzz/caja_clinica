const token = 'key_dKFRK9TBH0VwSHfUKtuncNt4UeCNuWnA';
const baseUrl = 'https://latam-1.wazend.net';
const sessionName = 'S0021';
const toPhone = '51937169571';
const textContent = '¡Hola! Prueba de envío de reporte desde Caja Clínica y Wazend';

async function testWazend(authHeaderName, authHeaderValue) {
  const url = `${baseUrl}/api/sendText`;
  console.log(`Testing POST ${url} with '${authHeaderName}' header...`);
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    headers[authHeaderName] = authHeaderValue;

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        session: sessionName,
        chatId: `${toPhone}@c.us`,
        text: textContent
      })
    });
    const status = response.status;
    const bodyText = await response.text();
    console.log(`Status: ${status}. Response: ${bodyText}\n`);
  } catch (err) {
    console.error(`Failed: ${err.message}\n`);
  }
}

async function run() {
  await testWazend('Authorization', `Bearer ${token}`);
  await testWazend('apikey', token);
  await testWazend('X-Api-Key', token);
}

run();
