import os
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@grokit.app")
APP_URL = os.getenv("APP_URL", "http://localhost:5050")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

_ses_client = None

def get_ses_client():
    """Get or create SES client singleton."""
    global _ses_client
    if _ses_client is None:
        _ses_client = boto3.client("ses", region_name=AWS_REGION)
    return _ses_client


def send_verification_email(to_email: str, token: str) -> bool:
    """Send email verification link to user via AWS SES.

    Args:
        to_email: The recipient's email address
        token: The verification token

    Returns:
        True if sent successfully, False otherwise
    """
    verification_link = f"{APP_URL}/auth/verify?token={token}"

    subject = "Verify your GroKit account"
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #1a1a24; border-radius: 16px; border: 1px solid #2a2a3a; overflow: hidden;">
                        <!-- Header with gradient -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); padding: 32px 40px; text-align: center;">
                                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">GroKit</h1>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 16px 0; color: #f0f0f5; font-size: 22px; font-weight: 600;">Verify your email</h2>
                                <p style="margin: 0 0 24px 0; color: #a0a0b0; font-size: 15px; line-height: 1.6;">
                                    Thanks for signing up! Click the button below to verify your email address and start creating AI-powered quizzes.
                                </p>
                                <!-- CTA Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding: 8px 0 24px 0;">
                                            <a href="{verification_link}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                                                Verify Email Address
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin: 0 0 8px 0; color: #6b6b7b; font-size: 13px;">
                                    This link will expire in 24 hours.
                                </p>
                                <p style="margin: 0; color: #6b6b7b; font-size: 13px;">
                                    If you didn't create an account, you can safely ignore this email.
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 24px 40px; border-top: 1px solid #2a2a3a; text-align: center;">
                                <p style="margin: 0; color: #6b6b7b; font-size: 12px;">
                                    &copy; 2024 GroKit. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    text_body = f"""
    GroKit - Verify Your Email
    ==========================

    Thanks for signing up! Click the link below to verify your email address:

    {verification_link}

    This link will expire in 24 hours.

    If you didn't create an account, you can safely ignore this email.

    --
    GroKit - AI-Powered Quiz Generation
    """

    ses = get_ses_client()
    try:
        response = ses.send_email(
            Source=FROM_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Text": {"Data": text_body, "Charset": "UTF-8"},
                    "Html": {"Data": html_body, "Charset": "UTF-8"}
                }
            }
        )
        logger.info(f"Verification email sent to {to_email}, MessageId: {response['MessageId']}")
        return True
    except ClientError as e:
        logger.error(f"Failed to send verification email: {e.response['Error']['Message']}")
        return False
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        return False
