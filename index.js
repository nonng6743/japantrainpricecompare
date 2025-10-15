const express = require('express');
const bodyParser = require('body-parser');
const exec = require('child_process').exec;
const crypto = require('crypto');

const app = express();
const port = 3005;

// GitHub webhook secret (ควรเก็บใน environment variable)
const WEBHOOK_SECRET = 'japantrainpricecompare@1111';

app.use(bodyParser.json());

app.get('/', async (req, res) => {
    res.send('Hello webhook api');
});

// ฟังก์ชันตรวจสอบ GitHub webhook signature
function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const digest = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// รับคำขอ POST ที่ /webhook
app.post('/webhook', (req, res) => {
  const payload = req.body;
  const signature = req.headers['x-hub-signature-256'];

  // ตรวจสอบ webhook signature
  if (!signature || !verifySignature(JSON.stringify(payload), signature, WEBHOOK_SECRET)) {
    console.log('Invalid webhook signature');
    return res.status(401).send('Unauthorized');
  }

  // ตรวจสอบว่าเป็น push event จาก GitHub
  if (req.headers['x-github-event'] === 'push') {
    const branch = payload.ref.split('/').pop();

    // ตรวจสอบ branch ที่เปลี่ยนแปลง
    if (branch === 'main') {
      // ดึงโค้ดจาก repository สำหรับ branch `main`
      exec('cd /var/www/japantrainpricecompare && git pull origin main', (err, stdout, stderr) => {
        if (err) {
          console.error('Error pulling main branch', stderr);
          return res.status(500).send('Error pulling main branch');
        }
        console.log('stdout: ', stdout);
        res.status(200).send('Main branch updated');
      });
    } else if (branch === 'backend') {
      // ดึงโค้ดจาก repository สำหรับ branch `backend`
      exec('cd /var/www/api/japantrainpricecompare && git pull origin backend', (err, stdout, stderr) => {
        if (err) {
          console.error('Error pulling backend branch', stderr);
          return res.status(500).send('Error pulling backend branch');
        }
        console.log('stdout: ', stdout);
        res.status(200).send('Backend branch updated');
      });
    } else {
      res.status(200).send('No action for this branch');
    }
  } else {
    res.status(400).send('Not a push event');
  }
});

app.listen(port, () => {
  console.log(`Webhook server running at http://localhost:${port}`);
});

