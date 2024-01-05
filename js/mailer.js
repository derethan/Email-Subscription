//import required modules
const nodeMailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

//Create an SMTP Nodemaiiler transporter object
const transporter = nodeMailer.createTransport(
    
    smtpTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, //use SSL/TLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        //do not fail on invalid certs
        rejectUnauthorized: false //TODO: remove this line in production
    }
})
);

module.exports = transporter; 