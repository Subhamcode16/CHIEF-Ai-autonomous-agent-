from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

with open("available_models.txt", "w") as f:
    f.write("Available models for generateContent:\n")
    # List models using the new SDK client
    # Note: The new SDK structure might differ. We iterate through models.
    for m in client.models.list():
        # Check if generateContent is supported (assuming similar attribute or just listing all)
        # The new SDK model object structure: check documentation or assume 'name'.
        # For safety in migration, we just list them.
        f.write(f"  - {m.name}\n")

print("Done - check available_models.txt")
