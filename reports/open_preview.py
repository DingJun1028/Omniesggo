
import webbrowser
import time

# Open the HTML file in the default browser
html_path = r"C:/Users/Administrator/hermes-first-task/Omniesggo-repo/reports/60員軍團角色畫像.html"
url = "file://" + html_path.replace("\\", "/")

print(f"Opening: {url}")
webbrowser.open(url)
time.sleep(2)

# Also try the local server approach
server_cmd = ["python", "-m", "http.server", "8765", "--bind", "127.0.0.1"]
try:
    # Start server in background
    server = subprocess.Popen(server_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd="C:/Users/Administrator/hermes-first-task/Omniesggo-repo/reports")
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
