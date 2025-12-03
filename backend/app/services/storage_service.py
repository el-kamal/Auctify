import boto3
from botocore.exceptions import NoCredentialsError
from fastapi import UploadFile
from app.core.config import settings
import uuid
import os

class StorageService:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.R2_ENDPOINT,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name=settings.R2_REGION
        )
        self.bucket_name = settings.R2_BUCKET
        self.public_base = settings.R2_PUBLIC_BASE

    async def upload_file(self, file: UploadFile, folder: str = "uploads") -> str:
        """
        Uploads a file to R2 and returns the public URL.
        """
        try:
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{folder}/{uuid.uuid4()}{file_extension}"
            
            # Read file content
            file_content = await file.read()
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=unique_filename,
                Body=file_content,
                ContentType=file.content_type
            )
            
            # Reset file pointer for potential future use
            await file.seek(0)
            
            return unique_filename
        except NoCredentialsError:
            raise Exception("Credentials not available")
        except Exception as e:
            raise Exception(f"Failed to upload file: {str(e)}")

    def delete_file(self, file_identifier: str):
        """
        Deletes a file from R2 given its key or public URL.
        """
        try:
            key = file_identifier
            if file_identifier.startswith(self.public_base):
                key = file_identifier.replace(f"{self.public_base}/", "")
            
            # Also handle if it's a full URL but not matching public_base (e.g. if config changed)
            # But for now, we assume it's either key or public_base prefixed.
            
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
        except Exception as e:
            print(f"Failed to delete file {file_identifier}: {str(e)}")

    def get_presigned_url(self, object_name: str, expiration: int = 3600) -> str:
        """
        Generate a presigned URL to share an S3 object
        """
        try:
            # If the object_name is a full URL, try to extract the key
            key = object_name
            if object_name.startswith("http"):
                 # Try to extract key from known public base
                if object_name.startswith(self.public_base):
                    key = object_name.replace(f"{self.public_base}/", "")
                else:
                    # Fallback: try to split by bucket name or just take the path?
                    # If we stored full URLs that are NOT public_base, we might have an issue.
                    # But let's assume we are migrating to keys.
                    # If it looks like a URL but we can't parse it, return it as is (it might be external?)
                    # Or just try to treat the last part as key? No, that's dangerous.
                    pass

            response = self.s3_client.generate_presigned_url('get_object',
                                                            Params={'Bucket': self.bucket_name,
                                                                    'Key': key},
                                                            ExpiresIn=expiration)
            return response
        except Exception as e:
            print(f"Error generating presigned URL: {e}")
            return object_name # Fallback to original if failure


storage_service = StorageService()
