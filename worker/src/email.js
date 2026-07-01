/**
 * Envía un email de notificación al equipo CAMECI cuando llega un mensaje de contacto.
 * Usa la API REST de Resend (reemplaza nodemailer que no funciona en Workers).
 */
export async function sendNotificationEmail(env, data) {
  const { nombre, telefono, correo, servicio, ubicacion, mensaje } = data;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Grupo CAMECI <onboarding@resend.dev>',
        to: [env.EMAIL_TO],
        subject: `🌐 Nueva Consulta Web: ${servicio || 'Sin especificar'} - ${nombre}`,
        html: `
          <p>Ha recibido un nuevo mensaje desde el formulario de contacto del sitio web. A continuación, se detallan los datos del interesado:</p>
          <br>
          <p><strong>Cliente:</strong> ${nombre}</p>
          <p><strong>Teléfono:</strong> <a href="tel:${telefono}">${telefono}</a></p>
          <p><strong>Correo:</strong> <a href="mailto:${correo}">${correo}</a></p>
          <p><strong>Ubicación de la propiedad:</strong> ${ubicacion}</p>
          <p><strong>SERVICIO SOLICITADO:</strong> &gt; 📌 ${servicio || 'Sin especificar'}</p>
          <p><strong>Mensaje o comentarios:</strong><br>"${mensaje}"</p>
          <br>
          <p><small>Este correo fue generado automáticamente desde el formulario de contacto de Grupo CAMECI.</small></p>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error enviando email de notificación:', errorText);
    }
  } catch (err) {
    console.error('Error enviando email de notificación:', err);
  }
}

/**
 * Envía un email de auto-respuesta al cliente confirmando recepción de su mensaje.
 */
export async function sendAutoReplyEmail(env, data) {
  const { nombre, correo, servicio } = data;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Grupo CAMECI <onboarding@resend.dev>',
        to: [correo],
        subject: 'Hemos recibido tu solicitud - Grupo CAMECI',
        html: `
          <p>¡Hola, <strong>${nombre}</strong>!</p>
          <p>Hemos recibido tu solicitud sobre <strong>${servicio || 'nuestros servicios'}</strong> en Grupo CAMECI.</p>
          <p>Uno de nuestros peritos certificados o asesores inmobiliarios se pondrá en contacto contigo en un lapso no mayor a 24 horas.</p>
          <br>
          <p>Gracias por tu confianza,</p>
          <p><strong>Grupo CAMECI</strong></p>
        `,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error enviando auto-respuesta:', errorText);
    }
  } catch (err) {
    console.error('Error enviando auto-respuesta:', err);
  }
}
