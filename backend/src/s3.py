import boto3
import os
import logging

logger = logging.getLogger(__name__)

S3_BUCKET = os.getenv("S3_BUCKET", "grokit-storage")

_s3_client = None

def get_s3_client():
    """Get or create S3 client singleton."""
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3")
    return _s3_client


def upload_file(key: str, content: str) -> str:
    """Upload content to S3.

    Args:
        key: The S3 object key (path within bucket)
        content: The file content as a string

    Returns:
        The S3 key of the uploaded file
    """
    s3 = get_s3_client()
    try:
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=content.encode("utf-8"),
            ContentType="text/plain" if key.endswith(".txt") else "application/json"
        )
        logger.info(f"Uploaded file to s3://{S3_BUCKET}/{key}")
        return key
    except Exception as e:
        logger.error(f"Failed to upload to S3: {e}")
        raise


def delete_file(key: str) -> bool:
    """Delete a file from S3.

    Args:
        key: The S3 object key to delete

    Returns:
        True if deleted successfully, False otherwise
    """
    s3 = get_s3_client()
    try:
        s3.delete_object(Bucket=S3_BUCKET, Key=key)
        logger.info(f"Deleted s3://{S3_BUCKET}/{key}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete from S3: {e}")
        return False


def get_file(key: str) -> str:
    """Get file content from S3.

    Args:
        key: The S3 object key

    Returns:
        The file content as a string
    """
    s3 = get_s3_client()
    try:
        response = s3.get_object(Bucket=S3_BUCKET, Key=key)
        return response["Body"].read().decode("utf-8")
    except Exception as e:
        logger.error(f"Failed to get from S3: {e}")
        raise
