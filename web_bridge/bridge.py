import asyncio
import websockets
import socket

TCP_HOST = "127.0.0.1"
TCP_PORT = 5000

WS_PORT = 8000


async def handle_websocket(websocket):

    print("Web client connected")

    tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    tcp_socket.connect((TCP_HOST, TCP_PORT))
    tcp_socket.setblocking(False)

    loop = asyncio.get_running_loop()


    async def websocket_to_tcp():

        async for message in websocket:

            print("FROM BROWSER:", message)

            tcp_socket.send((message + "\n").encode())


    async def tcp_to_websocket():

        buffer = ""

        while True:

            try:

                data = await loop.sock_recv(tcp_socket, 1024)

                if not data:
                    break

                buffer += data.decode()

                while "\n" in buffer:

                    msg, buffer = buffer.split("\n", 1)

                    if not msg.strip():
                        continue

                    print("FROM TCP SERVER:", msg)

                    await websocket.send(msg)

            except:
                await asyncio.sleep(0.01)


    await asyncio.gather(
        websocket_to_tcp(),
        tcp_to_websocket()
    )


async def main():

    print("WebSocket bridge running on port", WS_PORT)

    async with websockets.serve(handle_websocket, "0.0.0.0", WS_PORT):

        await asyncio.Future()


asyncio.run(main())