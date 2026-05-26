# ทดสอบ Mailjet Connection
docker exec -it backend-cem node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAILJET_API_KEY,
    pass: process.env.MAILJET_SECRET_KEY,
  },
});

transporter.verify().then(() => {
  console.log('Mailjet connection successful');
}).catch(err => {
  console.error('Mailjet connection failed:', err.message);
});
"
