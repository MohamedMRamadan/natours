// eslint-disable-next-line import/no-extraneous-dependencies
import { htmlToText } from 'html-to-text';
import { createTransport } from 'nodemailer';
import { fileURLToPath } from 'url';
import pug from 'pug';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Email {
  constructor(user, url) {
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `"Mohamed Mahmoud" <${process.env.EMAIL_FROM}>`;
    this.to = user.email;
  }

  createTransport() {
    if (process.env.NODE_ENV === 'production') {
      // SEND GMA
      return createTransport({
        service: 'gmail',
        host: process.env.GMAIL_HOST,
        port: process.env.PUBLIC_EMAIL_PORT,
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_PASSWORD,
        },
      });
    }
    return createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.PUBLIC_EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    //1) Render Html based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject: subject,
    });
    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      text: htmlToText(html),
      html,
    };
    // 3) send email
    await this.createTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family.');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 minutes)',
    );
  }
}
export default Email;
