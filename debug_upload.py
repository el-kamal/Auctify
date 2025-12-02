import requests
import sys

def test_upload():
    url = "http://localhost:8000/api/v1/import/mapping"
    files = {'file': open('test_mapping.xlsx', 'rb')}
    
    # We need to be authenticated. Let's login first.
    login_url = "http://localhost:8000/api/v1/login/access-token"
    login_data = {"username": "admin@auctify.com", "password": "admin"}
    
    session = requests.Session()
    login_resp = session.post(login_url, data=login_data)
    
    if login_resp.status_code != 200:
        print(f"Login failed: {login_resp.text}")
        return 1
        
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        print(f"Uploading to {url}...")
        response = requests.post(url, files=files, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            items = data.get("imported_items", [])
            print(f"Imported items count: {len(items)}")
            if len(items) > 0:
                print("SUCCESS: Items returned.")
                return 0
            else:
                print("FAILURE: No items returned.")
                return 1
        else:
            print("Upload FAILED!")
            return 1
            
    except Exception as e:
        print(f"An error occurred: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(test_upload())
