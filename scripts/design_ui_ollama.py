import json
import urllib.request
import os
import re

def call_ollama(prompt):
    url = "http://127.0.0.1:11434/api/generate"
    data = {
        "model": "qwen2.5:3b-64k",
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3
        }
    }
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["response"]
    except Exception as e:
        print(f"Ollama failed. Error: {e}")
        return ""

prompt = """
You are a Master UI/UX Designer practicing "Best Practice Awakening".
We need to upgrade an HTML overlay interface to the "Liquid Glass Cyan" Design System.
Core DNA:
- Void Stark Background: #020617 (with high transparency)
- Cyan Core Accent: #06b6d4
- Emerald Soul Accent: #10b981
- Glass Material: backdrop-filter: blur(12px), background: rgba(2, 6, 23, 0.6)
- Borders: 1px solid rgba(255, 255, 255, 0.1)
- Text: Clean sans-serif (#f8fafc), cyan glowing text-shadow for active states.
- Buttons: Pill shapes, hover scales up by 1.05, cyan glows on hover.

Please write ONLY the CSS block (without ```css tags, just the raw CSS code) that overrides the UI buttons (.icon-btn, .capsule, #toolbar, .sub-group) to match this aesthetic. Do not add explanations.
"""

print("🧠 Initiating UI/UX Aesthetics Awakening via local Ollama compute...")
css_output = call_ollama(prompt)

if css_output:
    # Clean up output
    css_output = css_output.replace("```css", "").replace("```", "").strip()
    
    html_path = 'apps/omnilive/public/index.html'
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Inject generated CSS right before closing </style>
    injection = f"\n/* --- L-Hub Ollama Generated: Liquid Glass Cyan Awakening --- */\n{css_output}\n/* --- End Ollama Design --- */\n"
    html = html.replace("</style>", injection + "</style>")
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
        
    print("✨ UI/UX Liquid Glass Cyan injection complete!")
else:
    print("❌ Failed to get UI design from Ollama.")
