import nodemailer from 'nodemailer';
import config from '../../config/config';

const SMTP_USER = config.smtp.user;
const SMTP_PASS = config.smtp.pass;

export default nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});
