import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

def test_gemini():
    env_path = Path(__file__).parent / '.env'
    load_dotenv(env_path)
    
    key = os.environ.get('GEMINI_API_KEY')
    print(f"Key found: {key[:5]}...{key[-3:] if key else ''}")
    
    if not key or "PLACE_YOUR" in key:
        print("ERROR: Please replace the placeholder in .env with your real Google AI Studio key.")
        return

    try:
        genai.configure(api_key=key)
        
        print(f"Key configured (Length: {len(key)})")

        found_models = []
        try:
            print("Listing available models...")
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    print(f" - {m.name}")
                    found_models.append(m.name)
        except Exception as e:
            print(f"List models failed: {e}")

        # Try multiple models
        models_to_try = ["gemini-1.5-flash", "models/gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"]
        
        # Add found models to priority
        if found_models:
             # prefer flash
             flash = next((m for m in found_models if 'flash' in m), None)
             if flash: models_to_try.insert(0, flash)

        for model_name in models_to_try:
            print(f"\nAttempting model: {model_name}...")
            try:
                # Handle model names that might already have 'models/' prefix
                if model_name.startswith("models/"):
                    clean_name = model_name.replace("models/", "")
                    model = genai.GenerativeModel(clean_name)
                else:
                    model = genai.GenerativeModel(model_name)
                
                response = model.generate_content("Test")
                print(f"SUCCESS with {model_name}: {response.text}")
                return # Exit on success
            except Exception as e:
                print(f"Failed with {model_name}: {e}")

        print("\n❌ All model attempts failed.")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    test_gemini()
