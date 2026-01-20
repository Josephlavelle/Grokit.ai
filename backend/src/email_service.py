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

    subject = "Verify your Grokit account"
    html_body = f"""
    <h2>Welcome to Grokit!</h2>
    <p>Please click the link below to verify your email address:</p>
    <p><a href="{verification_link}">{verification_link}</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account, you can ignore this email.</p>
    """
    text_body = f"""
    Welcome to Grokit!

    Please click the link below to verify your email address:
    {verification_link}

    This link will expire in 24 hours.

    If you didn't create an account, you can ignore this email.
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
