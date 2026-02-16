import boto3
import subprocess
import sys

# Try connecting with psql first
conn_string = "postgresql://neondb_owner:npg_vPVq9b6NhzjY@ep-frosty-pine-a1ldusuy-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

print("Attempted connection string (credentials redacted):")
print("postgresql://neondb_owner:******@ep-frosty-pine-a1ldusuy-pooler.ap-southeast-1.aws.neon.tech/neondb")
print()

# Try using psql  
try:
    print("Attempting to connect with psql...")
    result = subprocess.run(
        ["/usr/local/bin/psql", conn_string, "-c", "SELECT version();"],
        capture_output=True,
        text=True,
        timeout=5
    )
    if result.returncode == 0:
        print("✅ psql connection successful!")
        print(result.stdout[:200])
    else:
        print("❌ psql connection failed:", result.stderr[:200])
except FileNotFoundError:
    print("❌ psql not found, trying alternative method...")
except subprocess.TimeoutExpired:
    print("❌ Connection timed out")
except Exception as e:
    print(f"❌ Error: {e}")
