from app.services.storage_service import storage_service

def test_presigned():
    key = "logos/bordereau/test.jpg"
    url = storage_service.get_presigned_url(key)
    print(f"Key: {key}")
    print(f"Presigned URL: {url}")
    
    # Test with full URL
    full_url = f"{storage_service.public_base}/{key}"
    url2 = storage_service.get_presigned_url(full_url)
    print(f"Full URL: {full_url}")
    print(f"Presigned URL 2: {url2}")

if __name__ == "__main__":
    test_presigned()
