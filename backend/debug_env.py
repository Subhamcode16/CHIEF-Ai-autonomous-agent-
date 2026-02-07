from dotenv import load_dotenv
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def test():
    env_path = Path(__file__).parent / '.env'
    print(f"Loading env from: {env_path}")
    load_dotenv(env_path)
    
    url = os.environ.get('MONGO_URL')
    print(f"MONGO_URL is: '{url}'")
    
    if not url:
        print("ERROR: MONGO_URL is empty or None")
        return

    try:
        client = AsyncIOMotorClient(url)
        print("Client created successfully.")
        # Try a quick server info check (timeout in 2s)
        print("Attempting connection...")
        await asyncio.wait_for(client.server_info(), timeout=2.0)
        print("Connection SUCCESS!")
    except Exception as e:
        print(f"Connection ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test())
