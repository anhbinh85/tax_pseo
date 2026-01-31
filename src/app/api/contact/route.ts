import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ContactPayload = {
  name: string;
  email: string;
  message: string;
  company?: string;
  turnstileToken?: string;
};

const getEnv = (key: string) => process.env[key] ?? "";

export async function POST(request: Request) {
  const isDev = process.env.NODE_ENV !== "production";
  try {
    const body = (await request.json()) as ContactPayload;
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();
    const company = (body.company || "").trim();
    const turnstileToken = (body.turnstileToken || "").trim();

    if (company) {
      return NextResponse.json({ ok: true });
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Please fill all required fields." },
        { status: 400 }
      );
    }

    const turnstileSecret = getEnv("TURNSTILE_SECRET_KEY");
    if (!turnstileSecret) {
      return NextResponse.json(
        { error: "Spam protection is not configured." },
        { status: 500 }
      );
    }

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Please complete the verification." },
        { status: 400 }
      );
    }

    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstileToken
        })
      }
    );
    const verifyData = (await verifyRes.json()) as { success?: boolean };
    if (!verifyData.success) {
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 400 }
      );
    }

    const host = getEnv("SMTP_HOST");
    const port = Number(getEnv("SMTP_PORT") || "587");
    const user = getEnv("SMTP_USER");
    const pass = getEnv("SMTP_PASS");
    const to = getEnv("CONTACT_TO_EMAIL");
    const from = getEnv("SMTP_FROM") || user;

    if (!host || !user || !pass || !to || !from) {
      return NextResponse.json(
        { error: "Email service is not configured." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    try {
      await transporter.sendMail({
        from,
        to,
        replyTo: email,
        subject: `Contact request from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br />")}</p>
          </div>
        `
      });
    } catch (mailError) {
      const messageText =
        mailError instanceof Error ? mailError.message : "Email send failed.";
      return NextResponse.json(
        { error: isDev ? messageText : "Unable to send message." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    const messageText =
      error instanceof Error ? error.message : "Unable to send message.";
    return NextResponse.json(
      { error: isDev ? messageText : "Unable to send message." },
      { status: 500 }
    );
  }
}
