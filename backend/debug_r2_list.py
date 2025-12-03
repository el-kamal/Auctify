import asyncio
from app.services.storage_service import storage_service

async def list_files():
    try:
        print(f"Listing files in bucket: {storage_service.bucket_name}")
        response = storage_service.s3_client.list_objects_v2(Bucket=storage_service.bucket_name, Prefix="logos/")
        if 'Contents' in response:
            for obj in response['Contents']:
                print(f"Found: {obj['Key']} (Size: {obj['Size']})")
        else:
            print("No files found in 'logos/' prefix.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_files())
