let socket = null

export function connectSocket(onMessage, onOpen)
{
  socket = new WebSocket("ws://localhost:8000")

  socket.onopen = () =>
  {
    console.log("Connected to WebSocket bridge")

    if (onOpen)
    {
      onOpen()
    }
  }

  socket.onmessage = (event) =>
  {
    const data = JSON.parse(event.data)

    onMessage(data)
  }

  socket.onclose = () =>
  {
    console.log("WebSocket disconnected")
  }
}

export function sendMessage(message)
{
  if (socket && socket.readyState === WebSocket.OPEN)
  {
    socket.send(JSON.stringify(message))
  }
}