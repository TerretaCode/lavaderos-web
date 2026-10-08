// Rellenar cuando el cliente facilite los datos. Con WHATSAPP vacío, los botones abren WhatsApp para elegir contacto.
export const WHATSAPP = '34663423034'; // formato internacional sin '+', ej. '34600123456'
export const PHONE = '34663423034'; // formato internacional sin '+', ej. '34600123456'. Vacío = los botones de llamada no se muestran.
export const PHONE_LABEL = '663 42 30 34'; // opcional, cómo se muestra en pantalla, ej. '600 123 456'
export const PREVIEW = true; // true = web de revisión: noindex + etiqueta visible

export const wa = (text: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

export const tel = () => `tel:+${PHONE}`;

// API del formulario de contacto (contenedor propio en el host, con almacenamiento persistente).
// Absoluta a propósito: el frontend puede servirse desde Vercel/dominio propio y seguir hablando con ella (CORS habilitado en el servidor).
export const CONTACT_API = 'https://lavadero.william-agent.uk/api/contact';
