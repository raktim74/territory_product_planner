import urllib.request
import urllib.parse
import json

def fetch_data(email, password):
    try:
        data = urllib.parse.urlencode({'username': email, 'password': password}).encode()
        req = urllib.request.Request('http://localhost:8000/api/v1/auth/login', data=data)
        response = urllib.request.urlopen(req)
        token = json.loads(response.read().decode())['access_token']
        
        req = urllib.request.Request('http://localhost:8000/api/v1/product/analytics/dashboard', headers={'Authorization': f'Bearer {token}'})
        res = urllib.request.urlopen(req)
        print(f"[{email}]:", res.read().decode())
    except Exception as e:
        print(f"[{email}] Error:", e)

fetch_data('admin@acmecorp.com', 'admin123')
fetch_data('regional.manager@acmecorp.com', 'regional123') # assuming this exists based on old context
fetch_data('agent.na@acmecorp.com', 'agent123')
