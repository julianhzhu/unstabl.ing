import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailNotificationData {
  to: string;
  type: "vote" | "reply" | "replyToVoted" | "replyToReplied" | "verification";
  data: {
    ideaTitle: string;
    ideaContent: string;
    ideaId: string;
    authorName?: string;
    voterName?: string;
    replyContent?: string;
    verificationToken?: string;
  };
}

export async function sendEmailNotification(
  notification: EmailNotificationData
) {
  try {
    const { to, type, data } = notification;

    let subject = "";
    let html = "";

    switch (type) {
      case "vote":
        subject = `[UNSTABL.ING] VOTE DETECTED: "${data.ideaTitle}"`;
        html = generateVoteEmail(data);
        break;
      case "reply":
        subject = `[UNSTABL.ING] NEW RESPONSE: "${data.ideaTitle}"`;
        html = generateReplyEmail(data);
        break;
      case "replyToVoted":
        subject = `[UNSTABL.ING] THREAD UPDATE: "${data.ideaTitle}"`;
        html = generateReplyToVotedEmail(data);
        break;
      case "replyToReplied":
        subject = `[UNSTABL.ING] CONVERSATION CONTINUES: "${data.ideaTitle}"`;
        html = generateReplyToRepliedEmail(data);
        break;
      case "verification":
        subject = "[UNSTABL.ING] IDENTITY VERIFICATION REQUIRED";
        html = generateVerificationEmail(data);
        break;
    }

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Unstabl.ing <noreply@unstabl.ing>",
      to: [to],
      subject,
      html,
    });

    return result;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

function generateVoteEmail(data: EmailNotificationData["data"]) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>VOTE DETECTED</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          line-height: 1.4; 
          color: #00ff00; 
          background: #000000; 
          margin: 0; 
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background: #000000;
        }
        .header { 
          background: #111111; 
          padding: 20px; 
          border: 2px solid #00ff00; 
          margin-bottom: 20px; 
          text-align: center;
        }
        .idea-card { 
          border: 1px solid #00ff00; 
          padding: 20px; 
          margin: 20px 0; 
          background: #0a0a0a;
        }
        .button { 
          display: inline-block; 
          background: #000000; 
          color: #00ff00; 
          padding: 12px 24px; 
          text-decoration: none; 
          border: 2px solid #00ff00; 
          margin: 20px 0; 
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
        }
        .button:hover { background: #00ff00; color: #000000; }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #00ff00; 
          font-size: 12px; 
          color: #00aa00; 
        }
        .ascii { font-size: 10px; color: #00aa00; }
        .terminal { color: #00ff00; }
        .warning { color: #ffff00; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="ascii">
            ██╗   ██╗███╗   ██╗███████╗████████╗ █████╗ ██████╗ ██╗     ██╗██╗███╗   ██╗ ██████╗ 
            ██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║     ██║██║████╗  ██║██╔════╝ 
            ██║   ██║██╔██╗ ██║███████╗   ██║   ███████║██████╔╝██║     ██║██║██╔██╗ ██║██║  ███╗
            ██║   ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██╔══██╗██║     ██║██║██║╚██╗██║██║   ██║
            ╚██████╔╝██║ ╚████║███████║   ██║   ██║  ██║██████╔╝███████╗██║██║██║ ╚████║╚██████╔╝
             ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
          </div>
          <h1 class="terminal">[VOTE DETECTED]</h1>
          <p class="warning">>>> Someone just voted on your idea</p>
        </div>
        
        <div class="idea-card">
          <h2 class="terminal">${data.ideaTitle}</h2>
          <p>${data.ideaContent}</p>
          <p class="warning"><strong>VOTED BY:</strong> ${
            data.voterName || "ANONYMOUS"
          }</p>
        </div>
        
        <a href="${process.env.NEXTAUTH_URL}/idea/${
    data.ideaId
  }" class="button">[VIEW IDEA]</a>
        
        <div class="footer">
          <p class="ascii">>>> You're receiving this because you have email notifications enabled.</p>
          <p><a href="${
            process.env.NEXTAUTH_URL
          }/settings" style="color: #00ff00;">[MANAGE NOTIFICATIONS]</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateReplyEmail(data: EmailNotificationData["data"]) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>NEW RESPONSE</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          line-height: 1.4; 
          color: #00ff00; 
          background: #000000; 
          margin: 0; 
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background: #000000;
        }
        .header { 
          background: #111111; 
          padding: 20px; 
          border: 2px solid #00ff00; 
          margin-bottom: 20px; 
          text-align: center;
        }
        .idea-card { 
          border: 1px solid #00ff00; 
          padding: 20px; 
          margin: 20px 0; 
          background: #0a0a0a;
        }
        .reply-card { 
          background: #0a0a0a; 
          border-left: 4px solid #00ff00; 
          padding: 15px; 
          margin: 15px 0; 
          border: 1px solid #00ff00;
        }
        .button { 
          display: inline-block; 
          background: #000000; 
          color: #00ff00; 
          padding: 12px 24px; 
          text-decoration: none; 
          border: 2px solid #00ff00; 
          margin: 20px 0; 
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
        }
        .button:hover { background: #00ff00; color: #000000; }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #00ff00; 
          font-size: 12px; 
          color: #00aa00; 
        }
        .ascii { font-size: 10px; color: #00aa00; }
        .terminal { color: #00ff00; }
        .warning { color: #ffff00; }
        .response { color: #00ffff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="ascii">
            ██╗   ██╗███╗   ██╗███████╗████████╗ █████╗ ██████╗ ██╗     ██╗██╗███╗   ██╗ ██████╗ 
            ██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║     ██║██║████╗  ██║██╔════╝ 
            ██║   ██║██╔██╗ ██║███████╗   ██║   ███████║██████╔╝██║     ██║██║██╔██╗ ██║██║  ███╗
            ██║   ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██╔══██╗██║     ██║██║██║╚██╗██║██║   ██║
            ╚██████╔╝██║ ╚████║███████║   ██║   ██║  ██║██████╔╝███████╗██║██║██║ ╚████║╚██████╔╝
             ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
          </div>
          <h1 class="terminal">[NEW RESPONSE]</h1>
          <p class="warning">>>> Someone just replied to your idea</p>
        </div>
        
        <div class="idea-card">
          <h2 class="terminal">${data.ideaTitle}</h2>
          <p>${data.ideaContent}</p>
        </div>
        
        <div class="reply-card">
          <h3 class="response">[NEW REPLY]</h3>
          <p>${data.replyContent}</p>
          <p class="warning"><strong>FROM:</strong> ${
            data.authorName || "ANONYMOUS"
          }</p>
        </div>
        
        <a href="${process.env.NEXTAUTH_URL}/idea/${
    data.ideaId
  }" class="button">[VIEW REPLY]</a>
        
        <div class="footer">
          <p class="ascii">>>> You're receiving this because you have email notifications enabled.</p>
          <p><a href="${
            process.env.NEXTAUTH_URL
          }/settings" style="color: #00ff00;">[MANAGE NOTIFICATIONS]</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateReplyToVotedEmail(data: EmailNotificationData["data"]) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>THREAD UPDATE</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          line-height: 1.4; 
          color: #00ff00; 
          background: #000000; 
          margin: 0; 
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background: #000000;
        }
        .header { 
          background: #111111; 
          padding: 20px; 
          border: 2px solid #00ff00; 
          margin-bottom: 20px; 
          text-align: center;
        }
        .idea-card { 
          border: 1px solid #00ff00; 
          padding: 20px; 
          margin: 20px 0; 
          background: #0a0a0a;
        }
        .reply-card { 
          background: #0a0a0a; 
          border-left: 4px solid #00ff00; 
          padding: 15px; 
          margin: 15px 0; 
          border: 1px solid #00ff00;
        }
        .button { 
          display: inline-block; 
          background: #000000; 
          color: #00ff00; 
          padding: 12px 24px; 
          text-decoration: none; 
          border: 2px solid #00ff00; 
          margin: 20px 0; 
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
        }
        .button:hover { background: #00ff00; color: #000000; }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #00ff00; 
          font-size: 12px; 
          color: #00aa00; 
        }
        .ascii { font-size: 10px; color: #00aa00; }
        .terminal { color: #00ff00; }
        .warning { color: #ffff00; }
        .response { color: #00ffff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="ascii">
            ██╗   ██╗███╗   ██╗███████╗████████╗ █████╗ ██████╗ ██╗     ██╗██╗███╗   ██╗ ██████╗ 
            ██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║     ██║██║████╗  ██║██╔════╝ 
            ██║   ██║██╔██╗ ██║███████╗   ██║   ███████║██████╔╝██║     ██║██║██╔██╗ ██║██║  ███╗
            ██║   ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██╔══██╗██║     ██║██║██║╚██╗██║██║   ██║
            ╚██████╔╝██║ ╚████║███████║   ██║   ██║  ██║██████╔╝███████╗██║██║██║ ╚████║╚██████╔╝
             ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
          </div>
          <h1 class="terminal">[THREAD UPDATE]</h1>
          <p class="warning">>>> Someone replied to an idea you voted on</p>
        </div>
        
        <div class="idea-card">
          <h2 class="terminal">${data.ideaTitle}</h2>
          <p>${data.ideaContent}</p>
        </div>
        
        <div class="reply-card">
          <h3 class="response">[NEW REPLY]</h3>
          <p>${data.replyContent}</p>
          <p class="warning"><strong>FROM:</strong> ${
            data.authorName || "ANONYMOUS"
          }</p>
        </div>
        
        <a href="${process.env.NEXTAUTH_URL}/idea/${
    data.ideaId
  }" class="button">[VIEW REPLY]</a>
        
        <div class="footer">
          <p class="ascii">>>> You're receiving this because you have email notifications enabled.</p>
          <p><a href="${
            process.env.NEXTAUTH_URL
          }/settings" style="color: #00ff00;">[MANAGE NOTIFICATIONS]</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateReplyToRepliedEmail(data: EmailNotificationData["data"]) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CONVERSATION CONTINUES</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          line-height: 1.4; 
          color: #00ff00; 
          background: #000000; 
          margin: 0; 
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background: #000000;
        }
        .header { 
          background: #111111; 
          padding: 20px; 
          border: 2px solid #00ff00; 
          margin-bottom: 20px; 
          text-align: center;
        }
        .idea-card { 
          border: 1px solid #00ff00; 
          padding: 20px; 
          margin: 20px 0; 
          background: #0a0a0a;
        }
        .reply-card { 
          background: #0a0a0a; 
          border-left: 4px solid #00ff00; 
          padding: 15px; 
          margin: 15px 0; 
          border: 1px solid #00ff00;
        }
        .button { 
          display: inline-block; 
          background: #000000; 
          color: #00ff00; 
          padding: 12px 24px; 
          text-decoration: none; 
          border: 2px solid #00ff00; 
          margin: 20px 0; 
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
        }
        .button:hover { background: #00ff00; color: #000000; }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #00ff00; 
          font-size: 12px; 
          color: #00aa00; 
        }
        .ascii { font-size: 10px; color: #00aa00; }
        .terminal { color: #00ff00; }
        .warning { color: #ffff00; }
        .response { color: #00ffff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="ascii">
            ██╗   ██╗███╗   ██╗███████╗████████╗ █████╗ ██████╗ ██╗     ██╗██╗███╗   ██╗ ██████╗ 
            ██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║     ██║██║████╗  ██║██╔════╝ 
            ██║   ██║██╔██╗ ██║███████╗   ██║   ███████║██████╔╝██║     ██║██║██╔██╗ ██║██║  ███╗
            ██║   ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██╔══██╗██║     ██║██║██║╚██╗██║██║   ██║
            ╚██████╔╝██║ ╚████║███████║   ██║   ██║  ██║██████╔╝███████╗██║██║██║ ╚████║╚██████╔╝
             ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
          </div>
          <h1 class="terminal">[CONVERSATION CONTINUES]</h1>
          <p class="warning">>>> Someone replied to an idea you also replied to</p>
        </div>
        
        <div class="idea-card">
          <h2 class="terminal">${data.ideaTitle}</h2>
          <p>${data.ideaContent}</p>
        </div>
        
        <div class="reply-card">
          <h3 class="response">[NEW REPLY]</h3>
          <p>${data.replyContent}</p>
          <p class="warning"><strong>FROM:</strong> ${
            data.authorName || "ANONYMOUS"
          }</p>
        </div>
        
        <a href="${process.env.NEXTAUTH_URL}/idea/${
    data.ideaId
  }" class="button">[VIEW REPLY]</a>
        
        <div class="footer">
          <p class="ascii">>>> You're receiving this because you have email notifications enabled.</p>
          <p><a href="${
            process.env.NEXTAUTH_URL
          }/settings" style="color: #00ff00;">[MANAGE NOTIFICATIONS]</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateVerificationEmail(data: EmailNotificationData["data"]) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>IDENTITY VERIFICATION REQUIRED</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          line-height: 1.4; 
          color: #00ff00; 
          background: #000000; 
          margin: 0; 
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background: #000000;
        }
        .header { 
          background: #111111; 
          padding: 20px; 
          border: 2px solid #00ff00; 
          margin-bottom: 20px; 
          text-align: center;
        }
        .button { 
          display: inline-block; 
          background: #000000; 
          color: #00ff00; 
          padding: 15px 30px; 
          text-decoration: none; 
          border: 2px solid #00ff00; 
          margin: 20px 0; 
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
          font-size: 16px;
        }
        .button:hover { background: #00ff00; color: #000000; }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #00ff00; 
          font-size: 12px; 
          color: #00aa00; 
        }
        .ascii { font-size: 10px; color: #00aa00; }
        .terminal { color: #00ff00; }
        .warning { color: #ffff00; }
        .link-box { 
          word-break: break-all; 
          background: #0a0a0a; 
          padding: 10px; 
          border: 1px solid #00ff00; 
          color: #00aa00;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="ascii">
            ██╗   ██╗███╗   ██╗███████╗████████╗ █████╗ ██████╗ ██╗     ██╗██╗███╗   ██╗ ██████╗ 
            ██║   ██║████╗  ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██║     ██║██║████╗  ██║██╔════╝ 
            ██║   ██║██╔██╗ ██║███████╗   ██║   ███████║██████╔╝██║     ██║██║██╔██╗ ██║██║  ███╗
            ██║   ██║██║╚██╗██║╚════██║   ██║   ██╔══██║██╔══██╗██║     ██║██║██║╚██╗██║██║   ██║
            ╚██████╔╝██║ ╚████║███████║   ██║   ██║  ██║██████╔╝███████╗██║██║██║ ╚████║╚██████╔╝
             ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ 
          </div>
          <h1 class="terminal">[IDENTITY VERIFICATION REQUIRED]</h1>
          <p class="warning">>>> Click the button below to verify your email and start receiving notifications</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXTAUTH_URL}/verify-email?token=${data.verificationToken}" class="button">[VERIFY EMAIL ADDRESS]</a>
        </div>
        
        <p class="warning">If the button doesn't work, copy and paste this link into your browser:</p>
        <div class="link-box">
          ${process.env.NEXTAUTH_URL}/verify-email?token=${data.verificationToken}
        </div>
        
        <div class="footer">
          <p class="ascii">>>> This verification link will expire in 24 hours.</p>
          <p class="ascii">>>> If you didn't request this email, you can safely ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
