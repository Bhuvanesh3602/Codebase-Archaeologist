import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
if not key:
    print("No GEMINI_API_KEY found in .env file!")
else:
    genai.configure(api_key=key)
    try:
        print("=== Supported Models for your API Key ===")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name.replace("models/", ""))
    except Exception as e:
        print(f"Error: {e}")
