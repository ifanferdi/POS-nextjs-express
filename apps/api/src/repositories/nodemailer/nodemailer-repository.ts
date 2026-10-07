import Transporter from '@/infrastructure/nodemailer/nodemailer-connection';

export class NodemailerRepository {
  async sendMail(params: { from: string; to: string; subject: string; html: string }) {
    try {
      return await Transporter.sendMail(params);
    } catch (err) {
      console.error(err);
    }
  }
}
