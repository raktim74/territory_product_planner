import urllib.request
import urllib.parse
import json

# 1. Login user
data = urllib.parse.urlencode({'username': 'agent.na@acmecorp.com', 'password': 'password123'}).encode()
req = urllib.request.Request('http://localhost:8000/api/v1/auth/login', data=data)
try:
    response = urllib.request.urlopen(req)
    token = json.loads(response.read().decode())['access_token']

    # 2. Get Analytics
    req = urllib.request.Request('http://localhost:8000/api/v1/product/analytics/dashboard', headers={'Authorization': f'Bearer {token}'})
    res = urllib.request.urlopen(req)
    print(res.status, res.read().decode())
except Exception as e:
    print("Error:", e)
