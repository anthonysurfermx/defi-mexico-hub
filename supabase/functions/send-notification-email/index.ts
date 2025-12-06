// supabase/functions/send-notification-email/index.ts
// Edge Function para enviar notificaciones por email usando Resend
// Diseño: Pixel Art Style con colores DeFi México

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "anthochavez.ra@gmail.com";
const FROM_EMAIL = "DeFi México <noreply@defimexico.org>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "proposal_submitted" | "proposal_approved" | "proposal_rejected";
  userEmail: string;
  userName?: string;
  contentType: string;
  contentTitle: string;
  reviewNotes?: string;
}

const contentTypeLabels: Record<string, string> = {
  job: "Trabajo",
  startup: "Startup",
  community: "Comunidad",
  event: "Evento",
  referent: "Referente",
  course: "Curso",
  blog: "Blog Post",
};

// Iconos pixel art en base64 SVG para cada tipo de contenido
const contentTypeIcons: Record<string, string> = {
  job: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="8" width="24" height="18" fill="#00FF88" stroke="#00FF88" stroke-width="2"/>
    <rect x="8" y="4" width="16" height="6" fill="#00D4FF"/>
    <rect x="12" y="14" width="8" height="6" fill="#16171B"/>
  </svg>`,
  startup: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="16,2 28,28 4,28" fill="#00FF88"/>
    <rect x="14" y="12" width="4" height="10" fill="#16171B"/>
    <rect x="12" y="18" width="8" height="4" fill="#00D4FF"/>
  </svg>`,
  community: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="10" r="6" fill="#00FF88"/>
    <circle cx="8" cy="14" r="4" fill="#00D4FF"/>
    <circle cx="24" cy="14" r="4" fill="#00D4FF"/>
    <rect x="4" y="22" width="24" height="8" rx="2" fill="#00FF88"/>
  </svg>`,
  event: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="24" height="22" fill="#00D4FF"/>
    <rect x="4" y="6" width="24" height="6" fill="#00FF88"/>
    <rect x="8" y="2" width="4" height="6" fill="#00FF88"/>
    <rect x="20" y="2" width="4" height="6" fill="#00FF88"/>
  </svg>`,
  referent: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="12" r="8" fill="#00FF88"/>
    <rect x="8" y="22" width="16" height="8" fill="#00D4FF"/>
    <polygon points="16,4 18,10 24,10 19,14 21,20 16,16 11,20 13,14 8,10 14,10" fill="#16171B"/>
  </svg>`,
  course: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="20" height="24" fill="#00D4FF"/>
    <rect x="8" y="2" width="20" height="24" fill="#00FF88"/>
    <rect x="12" y="8" width="12" height="2" fill="#16171B"/>
    <rect x="12" y="14" width="12" height="2" fill="#16171B"/>
    <rect x="12" y="20" width="8" height="2" fill="#16171B"/>
  </svg>`,
  blog: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="24" height="24" fill="#00D4FF"/>
    <rect x="8" y="8" width="16" height="4" fill="#00FF88"/>
    <rect x="8" y="16" width="16" height="2" fill="#16171B"/>
    <rect x="8" y="20" width="12" height="2" fill="#16171B"/>
    <rect x="8" y="24" width="14" height="2" fill="#16171B"/>
  </svg>`,
};

// Estilos base para todos los emails - Pixel Art Style
const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #E5E7EB;
    background-color: #0D0F12;
    margin: 0;
    padding: 20px;
  }

  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #16171B;
    border: 4px solid #00FF88;
    box-shadow: 8px 8px 0px #00FF88, 0 0 30px rgba(0, 255, 136, 0.2);
  }

  .header {
    background: linear-gradient(180deg, #1C1D21 0%, #16171B 100%);
    padding: 30px;
    text-align: center;
    border-bottom: 4px solid #00FF88;
    position: relative;
  }

  .header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #00FF88, #00D4FF, #00FF88);
  }

  .pixel-logo {
    font-family: 'Press Start 2P', monospace;
    font-size: 18px;
    color: #00FF88;
    text-shadow: 2px 2px 0px #00D4FF;
    margin: 0;
    letter-spacing: 2px;
  }

  .pixel-subtitle {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    color: #00D4FF;
    margin-top: 8px;
  }

  .content {
    background: #16171B;
    padding: 30px;
  }

  .pixel-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 14px;
    color: #00FF88;
    margin: 0 0 20px 0;
    line-height: 1.8;
  }

  .badge {
    display: inline-block;
    background: #00FF88;
    color: #16171B;
    padding: 8px 16px;
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    font-weight: 700;
    border: 2px solid #00D4FF;
    box-shadow: 4px 4px 0px #00D4FF;
  }

  .badge-pending {
    background: #FCD34D;
    color: #16171B;
  }

  .badge-approved {
    background: #00FF88;
    color: #16171B;
  }

  .badge-rejected {
    background: #EF4444;
    color: #FFFFFF;
  }

  .pixel-box {
    background: #1C1D21;
    border: 2px solid #00D4FF;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 4px 4px 0px #00D4FF;
  }

  .pixel-button {
    display: inline-block;
    background: #00FF88;
    color: #16171B;
    padding: 14px 28px;
    text-decoration: none;
    font-family: 'Press Start 2P', monospace;
    font-size: 11px;
    font-weight: 700;
    border: 3px solid #00D4FF;
    box-shadow: 6px 6px 0px #00D4FF;
    margin-top: 20px;
    transition: all 0.1s;
  }

  .pixel-button:hover {
    transform: translate(2px, 2px);
    box-shadow: 4px 4px 0px #00D4FF;
  }

  .footer {
    text-align: center;
    padding: 20px;
    background: #1C1D21;
    border-top: 4px solid #00FF88;
  }

  .footer p {
    color: #6B7280;
    font-size: 12px;
    margin: 0;
  }

  .footer .pixel-text {
    font-family: 'Press Start 2P', monospace;
    font-size: 8px;
    color: #00D4FF;
  }

  .glow-text {
    color: #00FF88;
    text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
  }

  .info-label {
    color: #6B7280;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .info-value {
    color: #E5E7EB;
    font-weight: 600;
    font-size: 14px;
  }

  .divider {
    height: 4px;
    background: linear-gradient(90deg, transparent, #00FF88, #00D4FF, #00FF88, transparent);
    margin: 25px 0;
    border: none;
  }

  .notes-box {
    background: rgba(239, 68, 68, 0.1);
    border-left: 4px solid #EF4444;
    padding: 15px 20px;
    margin: 20px 0;
  }

  .pixel-decoration {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin: 15px 0;
  }

  .pixel-dot {
    width: 8px;
    height: 8px;
    background: #00FF88;
  }

  .pixel-dot:nth-child(2) {
    background: #00D4FF;
  }

  .pixel-dot:nth-child(3) {
    background: #00FF88;
  }
`;

// Template para email al usuario cuando envía propuesta
function getUserSubmittedEmail(data: EmailRequest): { subject: string; html: string } {
  const typeLabel = contentTypeLabels[data.contentType] || data.contentType;

  return {
    subject: `[DeFi MX] Propuesta recibida: ${data.contentTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="pixel-logo">DeFi MÉXICO</h1>
            <p class="pixel-subtitle">[ ECOSISTEMA WEB3 ]</p>
            <div class="pixel-decoration">
              <div class="pixel-dot"></div>
              <div class="pixel-dot"></div>
              <div class="pixel-dot"></div>
            </div>
          </div>

          <div class="content">
            <h2 class="pixel-title">¡PROPUESTA RECIBIDA!</h2>

            <p style="color: #E5E7EB;">Hola${data.userName ? ` <span class="glow-text">${data.userName}</span>` : ''},</p>

            <p style="color: #9CA3AF;">Hemos recibido tu propuesta de <strong style="color: #00D4FF;">${typeLabel}</strong>:</p>

            <div class="pixel-box">
              <p style="font-size: 16px; font-weight: 600; color: #00FF88; margin: 0;">"${data.contentTitle}"</p>
            </div>

            <p style="margin: 20px 0;">
              <span class="badge badge-pending">⏳ PENDIENTE</span>
            </p>

            <p style="color: #9CA3AF;">Nuestro equipo revisará tu propuesta y te notificaremos cuando sea aprobada o si necesitamos información adicional.</p>

            <div class="pixel-box" style="border-color: #00FF88;">
              <p style="margin: 0; color: #00FF88;">
                ⚡ Tiempo estimado de revisión: 24-48 horas
              </p>
            </div>

            <hr class="divider">

            <p style="color: #6B7280; font-size: 13px;">Si tienes alguna pregunta, puedes responder a este correo.</p>
          </div>

          <div class="footer">
            <p class="pixel-text">POWERED BY WEB3</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} DeFi México. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

// Template para email al admin cuando hay nueva propuesta
function getAdminNotificationEmail(data: EmailRequest): { subject: string; html: string } {
  const typeLabel = contentTypeLabels[data.contentType] || data.contentType;

  return {
    subject: `[ADMIN] Nueva propuesta: ${typeLabel} - ${data.contentTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="border-bottom-color: #00D4FF;">
            <h1 class="pixel-logo" style="color: #00D4FF;">ADMIN ALERT</h1>
            <p class="pixel-subtitle">[ NUEVA PROPUESTA ]</p>
          </div>

          <div class="content">
            <p style="margin-bottom: 15px;">
              <span class="badge" style="background: #00D4FF;">${typeLabel.toUpperCase()}</span>
            </p>

            <h2 style="color: #00FF88; font-size: 20px; margin: 20px 0;">${data.contentTitle}</h2>

            <div class="pixel-box">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td class="info-label" style="padding: 8px 0;">Tipo:</td>
                  <td class="info-value" style="padding: 8px 0;">${typeLabel}</td>
                </tr>
                <tr>
                  <td class="info-label" style="padding: 8px 0;">Enviado por:</td>
                  <td class="info-value" style="padding: 8px 0; color: #00D4FF;">${data.userEmail}</td>
                </tr>
                <tr>
                  <td class="info-label" style="padding: 8px 0;">Fecha:</td>
                  <td class="info-value" style="padding: 8px 0;">${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</td>
                </tr>
              </table>
            </div>

            <a href="https://defimexico.org/admin" class="pixel-button" style="background: #00D4FF;">
              → REVISAR
            </a>
          </div>

          <div class="footer">
            <p class="pixel-text">DeFi MÉXICO ADMIN</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

// Template para email al usuario cuando se aprueba
function getUserApprovedEmail(data: EmailRequest): { subject: string; html: string } {
  const typeLabel = contentTypeLabels[data.contentType] || data.contentType;

  // Determinar URL según el tipo de contenido
  const contentUrls: Record<string, string> = {
    job: 'https://defimexico.org/ecosistema/trabajos',
    startup: 'https://defimexico.org/ecosistema/startups',
    community: 'https://defimexico.org/ecosistema/comunidades',
    event: 'https://defimexico.org/eventos',
    referent: 'https://defimexico.org/ecosistema/referentes',
    course: 'https://defimexico.org/aprende',
    blog: 'https://defimexico.org/blog',
  };
  const contentUrl = contentUrls[data.contentType] || 'https://defimexico.org';

  return {
    subject: `[DeFi MX] ¡Propuesta APROBADA! ${data.contentTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container" style="box-shadow: 8px 8px 0px #00FF88, 0 0 50px rgba(0, 255, 136, 0.3);">
          <div class="header">
            <h1 class="pixel-logo">¡FELICIDADES!</h1>
            <div class="pixel-decoration">
              <div class="pixel-dot"></div>
              <div class="pixel-dot"></div>
              <div class="pixel-dot"></div>
            </div>
            <p class="pixel-subtitle">[ PROPUESTA APROBADA ]</p>
          </div>

          <div class="content">
            <p style="color: #E5E7EB;">Hola${data.userName ? ` <span class="glow-text">${data.userName}</span>` : ''},</p>

            <p style="color: #9CA3AF;">Nos complace informarte que tu propuesta de <strong style="color: #00D4FF;">${typeLabel}</strong> ha sido aprobada:</p>

            <div class="pixel-box" style="border-color: #00FF88; box-shadow: 4px 4px 0px #00FF88;">
              <p style="font-size: 18px; font-weight: 600; color: #00FF88; margin: 0;">"${data.contentTitle}"</p>
            </div>

            <p style="margin: 25px 0;">
              <span class="badge badge-approved">✓ PUBLICADO</span>
            </p>

            <p style="color: #9CA3AF;">Tu contenido ya está visible en <span style="color: #00FF88;">DeFi México</span>. ¡Gracias por contribuir al ecosistema Web3!</p>

            <a href="${contentUrl}" class="pixel-button">
              → VER MI PUBLICACIÓN
            </a>
          </div>

          <div class="footer">
            <p class="pixel-text">POWERED BY WEB3</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} DeFi México. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

// Template para email al usuario cuando se rechaza
function getUserRejectedEmail(data: EmailRequest): { subject: string; html: string } {
  const typeLabel = contentTypeLabels[data.contentType] || data.contentType;

  return {
    subject: `[DeFi MX] Actualización sobre tu propuesta: ${data.contentTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${baseStyles}</style>
      </head>
      <body>
        <div class="container" style="border-color: #6B7280; box-shadow: 8px 8px 0px #6B7280;">
          <div class="header" style="border-bottom-color: #6B7280;">
            <h1 class="pixel-logo" style="color: #9CA3AF;">DeFi MÉXICO</h1>
            <p class="pixel-subtitle" style="color: #6B7280;">[ ACTUALIZACIÓN ]</p>
          </div>

          <div class="content">
            <h2 class="pixel-title" style="color: #9CA3AF;">SOBRE TU PROPUESTA</h2>

            <p style="color: #E5E7EB;">Hola${data.userName ? ` ${data.userName}` : ''},</p>

            <p style="color: #9CA3AF;">Gracias por tu interés en contribuir a DeFi México. Después de revisar tu propuesta de <strong style="color: #00D4FF;">${typeLabel}</strong>:</p>

            <div class="pixel-box" style="border-color: #6B7280;">
              <p style="font-size: 15px; font-weight: 500; color: #9CA3AF; margin: 0;">"${data.contentTitle}"</p>
            </div>

            <p style="color: #9CA3AF;">Lamentamos informarte que no pudimos aprobarla en esta ocasión.</p>

            ${data.reviewNotes ? `
              <div class="notes-box">
                <p style="color: #EF4444; font-weight: 600; margin: 0 0 10px 0;">📝 Comentarios del equipo:</p>
                <p style="color: #E5E7EB; margin: 0;">${data.reviewNotes}</p>
              </div>
            ` : ''}

            <p style="color: #9CA3AF;">Te invitamos a revisar los comentarios y enviar una nueva propuesta cuando lo consideres conveniente.</p>

            <hr class="divider" style="background: linear-gradient(90deg, transparent, #6B7280, #6B7280, transparent);">

            <p style="color: #6B7280; font-size: 13px;">Si tienes preguntas, no dudes en contactarnos.</p>
          </div>

          <div class="footer" style="border-top-color: #6B7280;">
            <p class="pixel-text" style="color: #6B7280;">POWERED BY WEB3</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} DeFi México. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }

    console.log("Email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: String(error) };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const data: EmailRequest = await req.json();
    console.log("Received email request:", data);

    const results: { type: string; success: boolean; error?: string }[] = [];

    if (data.type === "proposal_submitted") {
      // Enviar email al usuario
      const userEmail = getUserSubmittedEmail(data);
      const userResult = await sendEmail(data.userEmail, userEmail.subject, userEmail.html);
      results.push({ type: "user_confirmation", ...userResult });

      // Enviar email al admin
      const adminEmail = getAdminNotificationEmail(data);
      const adminResult = await sendEmail(ADMIN_EMAIL, adminEmail.subject, adminEmail.html);
      results.push({ type: "admin_notification", ...adminResult });
    }
    else if (data.type === "proposal_approved") {
      const email = getUserApprovedEmail(data);
      const result = await sendEmail(data.userEmail, email.subject, email.html);
      results.push({ type: "user_approved", ...result });
    }
    else if (data.type === "proposal_rejected") {
      const email = getUserRejectedEmail(data);
      const result = await sendEmail(data.userEmail, email.subject, email.html);
      results.push({ type: "user_rejected", ...result });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
