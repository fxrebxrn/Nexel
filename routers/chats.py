from fastapi import APIRouter, Depends, UploadFile, File, Query, WebSocket, WebSocketDisconnect, status
from models import User
from schemas.chat_schemas import MessageCreate, ChatListResponse, WithMessageResponse, ChatResponse, AllMessagesReponse, MessageItem
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.security import get_current_user, get_current_user_ws
from schemas.util_schemas import MessageResponse
from typing import Annotated
from schemas.util_schemas import AttachmentResponse
from services.chat_service import ChatService
from datetime import datetime
from services.ws_manager import manager
from core.exceptions import InvalidTokenError, ExpiredTokenError

router = APIRouter(prefix="/chats", tags=["Chats"])

@router.websocket("/{chat_id}/ws")
async def websocket_test(websocket: WebSocket, chat_id: int, token: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    service = ChatService(db)
    current_user = None
    connected = False

    try:
        current_user = await get_current_user_ws(token, db)
        await service.get_if_participant(chat_id, current_user.id)

        await manager.connect(chat_id, current_user.id, websocket)
        connected = True

        while True:
            data = await websocket.receive_json()

            if data.get("type") == "typing":
                await manager.send_to_chat(
                    chat_id,
                    {
                        "type": "typing",
                        "chat_id": chat_id,
                        "user_id": current_user.id
                    },
                    exclude_user_id=current_user.id
                )

    except WebSocketDisconnect:
        if connected and current_user is not None:
            manager.disconnect(chat_id, current_user.id, websocket)

    except (InvalidTokenError, ExpiredTokenError):
        if connected and current_user is not None:
            manager.disconnect(chat_id, current_user.id, websocket)
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)

    except Exception:
        if connected and current_user is not None:
            manager.disconnect(chat_id, current_user.id, websocket)
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)

@router.post("/{chat_id}/messages", response_model=WithMessageResponse)
async def new_message(chat_id: int, message: MessageCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    service = ChatService(db)
    
    result = await service.new_message(chat_id, message, current_user)
    item_json = MessageItem.model_validate(result["data"]).model_dump(mode="json")

    await manager.send_to_chat(chat_id, {
        "type": "message",
        "chat_id": chat_id,
        "message_data": item_json
    })

    return result

@router.post("/{message_id}/attachments", response_model=AttachmentResponse)
async def upload_attachments_for_message(message_id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)], files: list[UploadFile] = File(...)):
    service = ChatService(db)
    return await service.upload_attachments_for_message(message_id, current_user, files)

@router.post("/{user_id}", response_model=ChatResponse)
async def new_chat(user_id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    service = ChatService(db)
    return await service.new_chat(user_id, current_user)

@router.get("/{chat_id}/messages", response_model=AllMessagesReponse)
async def get_messages_from_chat(chat_id: int,
                                current_user: Annotated[User, Depends(get_current_user)],
                                db: Annotated[AsyncSession, Depends(get_db)], 
                                limit: int = Query(50, ge=1, le=50),
                                cursor_created_at: datetime | None = None, 
                                cursor_id: int | None = None):
    service = ChatService(db)
    return await service.get_chat_messages(chat_id, current_user, limit, cursor_created_at, cursor_id)

@router.get("/{chat_id}/unread-count", response_model=MessageResponse)
async def get_count_of_unread_messages(chat_id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    service = ChatService(db)
    return await service.get_count_of_unread_messages(chat_id, current_user)

@router.get("/", response_model=ChatListResponse)
async def get_all_user_chats(current_user: Annotated[User, Depends(get_current_user)], 
                            db: Annotated[AsyncSession, Depends(get_db)], 
                            limit: int = Query(50, ge=1, le=50),
                            cursor_updated_at: datetime | None = None, 
                            cursor_id: int | None = None):
    service = ChatService(db)
    return await service.get_all_user_chats(current_user, limit, cursor_updated_at, cursor_id)

@router.patch("/{chat_id}/read", response_model=MessageResponse)
async def read_all_messages_in_chat(chat_id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    service = ChatService(db)
    return await service.read_all_messages_in_chat(chat_id, current_user)

@router.delete("/attachments/{attachment_id}", response_model=MessageResponse)
async def remove_att_from_message(attachment_id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    service = ChatService(db)
    return await service.remove_att_from_message(attachment_id, current_user)

@router.delete("/messages/{message_id}", response_model=MessageResponse)
async def remove_message(message_id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    service = ChatService(db)
    return await service.remove_message(message_id, current_user)

@router.delete("/{chat_id}", response_model=MessageResponse)
async def delete_chat(chat_id: int, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)]):
    service = ChatService(db)
    return await service.delete_chat(chat_id, current_user)
