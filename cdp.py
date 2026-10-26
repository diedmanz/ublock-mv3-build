import json, socket, struct, base64, os, urllib.request
from urllib.parse import urlparse

def http_json(url):
    return json.load(urllib.request.urlopen(url, timeout=10))

def cdp_open(ws_url):
    u = urlparse(ws_url)
    s = socket.create_connection((u.hostname, u.port), timeout=20)
    s.settimeout(90)
    key = base64.b64encode(os.urandom(16)).decode()
    s.send((f"GET {u.path} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\n"
            f"Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n").encode())
    buf = b""
    while b"\r\n\r\n" not in buf:
        buf += s.recv(4096)
    def send(msg):
        data = json.dumps(msg).encode()
        mask = os.urandom(4); n = len(data)
        hdr = bytearray([0x81])
        if n < 126: hdr.append(0x80 | n)
        elif n < 65536: hdr.append(0x80 | 126); hdr += struct.pack('>H', n)
        else: hdr.append(0x80 | 127); hdr += struct.pack('>Q', n)
        hdr += mask
        s.send(bytes(hdr) + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))
    def recv():
        h = s.recv(2)
        if not h: return None
        ln = h[1] & 0x7f
        if ln == 126: ln = struct.unpack('>H', s.recv(2))[0]
        elif ln == 127: ln = struct.unpack('>Q', s.recv(8))[0]
        data = b""
        while len(data) < ln: data += s.recv(ln - len(data))
        return json.loads(data.decode())
    return s, send, recv

def evaluate(send, recv, expr, msg_id=1, timeout=30):
    send({"id": msg_id, "method": "Runtime.evaluate",
          "params": {"expression": expr, "awaitPromise": True, "returnByValue": True}})
    for _ in range(120):
        m = recv()
        if m and m.get("id") == msg_id:
            r = m.get("result", {})
            if "exceptionDetails" in r:
                return {"__error__": r["exceptionDetails"].get("exception", {}).get("description")
                        or r["exceptionDetails"].get("text")}
            return r.get("result", {}).get("value")
    return {"__timeout__": True}
