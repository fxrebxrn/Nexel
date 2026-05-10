// messages.js
function updateChatPreviewFromMessage(message) {
    if (!message) return;

    const chatId = message.chat_id;
    const chatButton = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);

    if (!chatButton) return;

    const previewElement = chatButton.querySelector(".chat-preview");

    if (previewElement) {
        const currentUserId = getCurrentUserId();

        const senderId = message.sender?.id || message.sender_id;
        const isMine = String(senderId) === String(currentUserId);

        previewElement.innerHTML = `
            <span class="prefix">${isMine ? "You: " : ""}</span>${message.text || "New message"}
        `;
    }

    const chatList = document.getElementById('chat-list');
    if (chatList) {
        chatList.prepend(chatButton);
    }
}

function formatMessageTime(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleTimeString('ru-RU', {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

async function loadOlderMessages() {
    if (!currentChatId) {
        return;
    }

    if (!messagesHasMore || !messagesNextCursor || isLoadingMoreMessages) {
        return;
    }

    isLoadingMoreMessages = true;

    const oldScrollHeight = messagesList.scrollHeight;
    const oldScrollTop = messagesList.scrollTop;

    const params = new URLSearchParams({
        limit: "50",
        cursor_created_at: messagesNextCursor.created_at,
        cursor_id: String(messagesNextCursor.id)
    });

    try {
        const response = await authFetch(
            `/chats/${currentChatId}/messages?${params.toString()}`,
            {
                method: "GET"
            }
        );

        if (!response) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error("Failed to load older messages:", data);
            return;
        }

        const olderMessages = data.items || [];

        messagesNextCursor = data.next_cursor;
        messagesHasMore = data.has_more;

        const existingIds = new Set(
            currentMessages.map((message) => Number(message.id))
        );

        const uniqueOlderMessages = olderMessages.filter((message) => {
            return !existingIds.has(Number(message.id));
        });

        currentMessages = [
            ...uniqueOlderMessages,
            ...currentMessages
        ];

        renderMessages(currentMessages, false);

        const newScrollHeight = messagesList.scrollHeight;
        messagesList.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;

    } catch (error) {
        console.error("Load older messages error:", error);
    } finally {
        isLoadingMoreMessages = false;
    }
}

function renderMessages(messages, scrollToBottom = true) {
    currentMessages = messages;

    messagesList.innerHTML = "";

    if (!messages || messages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-messages">
                No messages yet
            </div>
        `;
        return;
    }

    const currentUserId = getCurrentUserId();

    messages.forEach((msg, index) => {
        const previousMsg = messages[index - 1];
        const nextMsg = messages[index + 1];

        const senderId = msg.sender?.id || msg.sender_id;
        const senderName = msg.sender?.name || "User";

        const previousSenderId = previousMsg?.sender?.id || previousMsg?.sender_id;
        const nextSenderId = nextMsg?.sender?.id || nextMsg?.sender_id;

        const isMine = Number(senderId) === Number(currentUserId);

        const isFirstInGroup = !previousMsg || Number(previousSenderId) !== Number(senderId);
        const isLastInGroup = !nextMsg || Number(nextSenderId) !== Number(senderId);

        const messageRow = document.createElement("div");
        messageRow.className = `message-row ${isMine ? "outgoing" : "incoming"}`;

        if (isLastInGroup) {
            messageRow.classList.add("last-in-group");
        }

        const initials = getInitials(senderName);
        const timeString = formatMessageTime(msg.created_at);

        messageRow.innerHTML = `
            ${!isMine ? `<div class="avatar">${initials}</div>` : ""}

            <div class="message-content">
                ${!isMine && isFirstInGroup ? `<div class="message-author">${escapeHTML(senderName)}</div>` : ""}

                <div class="message-bubble">
                    <div class="message-text">${escapeHTML(msg.text || "")}</div>
                    <span class="message-time">${timeString}</span>
                </div>
            </div>
        `;

        messagesList.appendChild(messageRow);
    });

    if (scrollToBottom) {
        messagesList.scrollTop = messagesList.scrollHeight;
    }
}

async function loadMessages(chatId) {
    const response = await authFetch(`/chats/${chatId}/messages?limit=50`, {
        method: "GET"
    });

    if (!response) {
        return;
    }

    const data = await response.json();

    if (!response.ok) {
        messagesList.innerHTML = `
            <div class="empty-messages">
                Failed to load messages
            </div>
        `;
        return;
    }

    const messages = data.items || [];

    messagesNextCursor = data.next_cursor;
    messagesHasMore = data.has_more;

    renderMessages(messages, true);
}

async function sendMessage(chatId, text) {
    if (isSendingMessage) {
        return;
    }

    isSendingMessage = true;
    sendButton.disabled = true;

    const token = getAccessToken();

    if (!token) {
        isSendingMessage = false;
        sendButton.disabled = false;
        showAuthScreen();
        return;
    }

    try {
        const response = await authFetch(`/chats/${chatId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: text
            })
        });

        if (!response) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error("Send message error:", data);
            showToast(data.detail || "Failed to send message", "error");
            return;
        }

        const sentMessageId = data.data?.id;
        scheduleMessageFallback(chatId, sentMessageId);

        messageInput.value = "";
        clearCurrentMessageDraft();
        resizeMessageInput();
        hideTypingIndicator();
        messageInput.style.height = "40px";

        if (isMobileLayout()) {
            setTimeout(() => {
                messageInput.focus({ preventScroll: true });
            }, 50);
        }

    } catch (error) {
        console.error("Failed to send message:", error);
    } finally {
        isSendingMessage = false;
        sendButton.disabled = false;
    }
}
