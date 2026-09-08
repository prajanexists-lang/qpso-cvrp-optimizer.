import http.server
import socketserver
import os
import urllib.parse

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SmartHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.strip('/')
        
        # URL routing aliases for clean paths
        route_map = {
            '': 'index.html',
            'home': 'index.html',
            'dashboard': 'dashboard.html',
            'quantum': 'quantum.html',
            'quantum-lab': 'quantum.html',
            'quantum-labs': 'quantum.html',
            'quantum_lab': 'quantum.html',
            'quantum_labs': 'quantum.html',
            'quantumlab': 'quantum.html',
            'quantumlabs': 'quantum.html',
            'docs': 'docs.html',
            'about': 'about.html',
            'pitch': 'pitch_script.html',
            'pitch_script': 'pitch_script.html',
            'compare': 'compare.html',
            'presentation': 'sih_presentation.html',
        }

        clean_path = path.lower().rstrip('/')
        if clean_path in route_map:
            target = route_map[clean_path]
            self.path = '/' + target + (('?' + parsed.query) if parsed.query else '')
        elif not os.path.exists(os.path.join(DIRECTORY, path)) and os.path.exists(os.path.join(DIRECTORY, path + '.html')):
            self.path = '/' + path + '.html' + (('?' + parsed.query) if parsed.query else '')

        return super().do_GET()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SmartHTTPRequestHandler) as httpd:
        print(f"Smart HTTP Server serving {DIRECTORY} on port {PORT} with clean URL routing...")
        httpd.serve_forever()
