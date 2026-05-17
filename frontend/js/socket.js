let isPageClosing = false;

function setSocketStatus(status) {
    if (!chatHeaderStatus) {
        return;
    }

    chatHeaderStatus.classList.remove("hidden", "connected", "reconnecting", "offline");

    if (status === "connected") {
        chatHeaderStatus.textContent = "Connected";
        chatHeaderStatus.classList.add("connected");
        return;
    }

    if (status === "reconnecting") {
        chatHeaderStatus.textContent = "Reconnecting...";
        chatHeaderStatus.classList.add("reconnecting");
        return;
    }

    chatHeaderStatus.textContent = "Offline";
    chatHeaderStatus.classList.add("offline");
}

function scheduleMessageFallback(chatId, messageId) {
    if (!messageId) {
        return;
    }

    if (pendingMessageFallbackTimeouts.has(Number(messageId))) {
        clearTimeout(pendingMessageFallbackTimeouts.get(Number(messageId)));
    }

    const timeoutId = setTimeout(async () => {
        const exists = currentMessages.some((message) => {
            return Number(message.id) === Number(messageId);
        });

        if (!exists && Number(chatId) === Number(currentChatId)) {
            console.warn("WebSocket message was not received, reloading messages");
            showToast("Syncing messages...", "warning");
            await loadMessages(chatId);
        }

        pendingMessageFallbackTimeouts.delete(Number(messageId));
    }, 1200);

    pendingMessageFallbackTimeouts.set(Number(messageId), timeoutId);
}

function appendMessageFromSocket(message) {
    if (!message) {
        console.warn("No message payload, cannot append");
        return;
    }

    if (pendingMessageFallbackTimeouts.has(Number(message.id))) {
        clearTimeout(pendingMessageFallbackTimeouts.get(Number(message.id)));
        pendingMessageFallbackTimeouts.delete(Number(message.id));
    }

    if (Number(message.chat_id) !== Number(currentChatId)) {
        return;
    }

    const alreadyExists = currentMessages.some((msg) => {
        return Number(msg.id) === Number(message.id);
    });

    if (alreadyExists) {
        return;
    }

    hideTypingIndicator();

    currentMessages.push(message);

    renderMessages(currentMessages);
}

function closeChatSocket(allowReconnect = false) {
    shouldReconnectSocket = allowReconnect;

    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    if (chatSocket) {
        chatSocket.close();
        chatSocket = null;
    }
}

async function reconnectChatSocket(chatId) {
    if (isPageClosing) {
        return;
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn("Max WebSocket reconnect attempts reached");
        setSocketStatus("offline");
        showToast("Connection lost", "error")
        return;
    }

    reconnectAttempts += 1;

    const delay = Math.min(1000 * reconnectAttempts, 5000);

    showToast("Reconnecting...", "warning");

    reconnectTimeout = setTimeout(async () => {
        if (isPageClosing || !currentChatId || Number(chatId) !== Number(currentChatId)) {
            return;
        }

        await refreshAccessToken();

        connectChatSocket(chatId);
    }, delay);
}

function connectChatSocket(chatId) {
    const token = getAccessToken();

    if (!token) {
        showAuthScreen();
        return;
    }

    closeChatSocket(false);
    shouldReconnectSocket = true;

    const wsUrl = `${WS_URL}/chats/${chatId}/ws?token=${token}`;

    chatSocket = new WebSocket(wsUrl);

    chatSocket.onopen = () => {
        reconnectAttempts = 0;
        setSocketStatus("connected");
    };

    chatSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "message" || data.type === "new_message") {
            const message = data.message_data || data.message || data.data;

            updateChatPreviewFromMessage(message);

            const currentUserId = getCurrentUserId();
            const senderId = message.sender?.id || message.sender_id;
            const isMine = Number(senderId) === Number(currentUserId);

            if (Number(data.chat_id) !== Number(currentChatId)) {
                if (!isMine) {
                    const chat = currentChats.find((item) => {
                        return Number(item.chat_id) === Number(data.chat_id);
                    });

                    const nextUnreadCount = Number(chat?.unread_count || 0) + 1;

                    if (chat) {
                        chat.unread_count = nextUnreadCount;
                    }

                    updateChatUnreadBadge(data.chat_id, nextUnreadCount);
                }

                return;
            }

            appendMessageFromSocket(message);

            if (!isMine) {
                markChatAsRead(data.chat_id);
            }

            return;
        }

        if (data.type === "typing") {
            if (data.chat_id && Number(data.chat_id) !== Number(currentChatId)) {
                return;
            }

            showTypingIndicator();
            return;
        }

    };

    chatSocket.onclose = async () => {
        if (isPageClosing) {
            return;
        }

        if (!shouldReconnectSocket) {
            setSocketStatus("offline");
            return;
        }

        if (Number(chatId) !== Number(currentChatId)) {
            return;
        }

        setSocketStatus("reconnecting");
        await reconnectChatSocket(chatId);
    };

    chatSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };
}

window.addEventListener("beforeunload", () => {
    isPageClosing = true;
    closeChatSocket(false);
});
