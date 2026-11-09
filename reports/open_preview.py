
import subprocess
import time
import webbrowser
from pathlib import Path

reports_dir = Path(__file__).resolve().parent
html_path = reports_dir / '60員軍團角色畫像.html'

# Open the HTML file in the default browser
url = html_path.as_uri()

print(f"Opening: {url}")
webbrowser.open(url)
time.sleep(2)

# Also try the local server approach
server_cmd = ["python", "-m", "http.server", "8765", "--bind", "127.0.0.1"]
try:
    # Start server in background
    server = subprocess.Popen(server_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd=reports_dir)
    print("Started local HTTP server on port 8765")
    time.sleep(1)
    
    # Open the page
    webbrowser.open("http://127.0.0.1:8765/60員軍團角色畫像.html")
    print("Page opened in browser")
    print("Press Ctrl+C to stop the server")
    
    # Keep server running
    try:
        server.wait()
    except KeyboardInterrupt:
        print("Server stopped")
except Exception as e:
    print(f"Error: {e}")
