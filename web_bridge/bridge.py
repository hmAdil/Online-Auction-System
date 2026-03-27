import asyncio
import websockets
import socket
import json

TCP_HOST = "127.0.0.1"
TCP_PORT = 5000
WS_PORT = 8000


async def handle_websocket(websocket):
    print(f"Web client connected: {websocket.remote_address}")

    tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        tcp_socket.connect((TCP_HOST, TCP_PORT))
    except ConnectionRefusedError:
        print("Could not connect to TCP server")
        await websocket.close()
        return

    tcp_socket.setblocking(False)
    loop = asyncio.get_running_loop()

    async def websocket_to_tcp():
        try:
            async for message in websocket:
                print(f"→ BROWSER: {message}")
                tcp_socket.send((message + "\n").encode())
        except websockets.ConnectionClosed:
            pass

    async def tcp_to_websocket():
        buffer = ""
        try:
            while True:
                try:
                    data = await loop.sock_recv(tcp_socket, 4096)
                    if not data:
                        break
                    buffer += data.decode()
                    while "\n" in buffer:
                        msg, buffer = buffer.split("\n", 1)
                        msg = msg.strip()
                        if not msg:
                            continue
                        print(f"← SERVER: {msg}")
                        try:
                            await websocket.send(msg)
                        except websockets.ConnectionClosed:
                            return
                except BlockingIOError:
                    await asyncio.sleep(0.01)
                except Exception as e:
                    print(f"TCP recv error: {e}")
                    await asyncio.sleep(0.01)
        except Exception as e:
            print(f"tcp_to_websocket error: {e}")

    try:
        await asyncio.gather(
            websocket_to_tcp(),
            tcp_to_websocket()
        )
    finally:
        tcp_socket.close()
        print(f"🔌 Client disconnected: {websocket.remote_address}")


async def main():
    print(f"WebSocket bridge running on port {WS_PORT}")
    async with websockets.serve(handle_websocket, "0.0.0.0", WS_PORT):
        await asyncio.Future()


asyncio.run(main())
