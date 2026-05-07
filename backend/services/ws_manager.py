from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, dict[int, list[WebSocket]]] = {}

    async def connect(self, chat_id: int, user_id: int, websocket: WebSocket):
        await websocket.accept()

        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = {}

        if user_id not in self.active_connections[chat_id]:
            self.active_connections[chat_id][user_id] = []

        self.active_connections[chat_id][user_id].append(websocket)

    def disconnect(self, chat_id: int, user_id: int, websocket: WebSocket):
        if chat_id not in self.active_connections:
            return

        if user_id not in self.active_connections[chat_id]:
            return

        user_connections = self.active_connections[chat_id][user_id]

        if websocket in user_connections:
            user_connections.remove(websocket)

        if not user_connections:
            del self.active_connections[chat_id][user_id]

        if not self.active_connections[chat_id]:
            del self.active_connections[chat_id]

    async def send_to_chat(self, chat_id: int, data: dict, exclude_user_id: int | None = None):
        chat_connections = self.active_connections.get(chat_id, {})

        for user_id, connections in chat_connections.items():
            if exclude_user_id is not None and user_id == exclude_user_id:
                continue

            for connection in connections:
                await connection.send_json(data)

manager = ConnectionManager()
