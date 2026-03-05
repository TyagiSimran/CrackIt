import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
MAIL_FROM = os.getenv("MAIL_FROM", SMTP_USER)

def send_reset_email(to_email: str, reset_link: str):
    if not SMTP_USER or not SMTP_PASS:
        print("[WARNING] SMTP credentials not set. Reset link:", reset_link)
        return False

    msg = MIMEMultipart()
    msg['From'] = MAIL_FROM
    msg['To'] = to_email
    msg['Subject'] = "Reset Your CrackIt Password"

    body = f"""
    Hello,

    We received a request to reset your password for your CrackIt account.
    Click the link below to set a new password:

    {reset_link}

    This link will expire in 15 minutes.

    If you did not request a password reset, please ignore this email.

    Best regards,
    CrackIt Team
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send email: {e}")
        return False
