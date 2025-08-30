// src/lib/sendEmail.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!); // Asegúrate de tener SENDGRID_API_KEY en .env
// Ejemplo: SENDGRID_API_KEY=tu_api_key

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const msg = {
    to,
    from: {
      email: process.env.FROM_EMAIL!, // Debe ser un correo verificado en SendGrid
      name: 'Web Wizard',
    },
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email enviado a: ${to}`);
  } catch (error: any) {
    console.error('❌ Error enviando correo:', error.response?.body || error);
    throw new Error('Error enviando correo');
  }
}
