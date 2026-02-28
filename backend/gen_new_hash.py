import bcrypt
password = b"admin123"
hashed = bcrypt.hashpw(password, bcrypt.gensalt(12))
print(hashed.decode())
