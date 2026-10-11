const nodemailer = require("nodemailer");

let transporter;

function emailConfigurado() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function obterTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });
  }
  return transporter;
}

// Retorna true se o e-mail foi enviado; false se o Gmail não está configurado ou o envio falhou
async function enviarEmail({ para, assunto, texto }) {
  if (!emailConfigurado()) return false;

  try {
    await obterTransporter().sendMail({
      from: `"Conecta Nova Santa Rita" <${process.env.GMAIL_USER}>`,
      to: para,
      subject: assunto,
      text: texto
    });
    return true;
  } catch (erro) {
    console.error("Falha ao enviar e-mail:", erro.message);
    return false;
  }
}

module.exports = { enviarEmail, emailConfigurado };
