import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

with open("available_models.txt", "w") as f:
    f.write("Available models for generateContent:\n")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            f.write(f"  - {m.name}\n")
print("Done - check available_models.txt")
