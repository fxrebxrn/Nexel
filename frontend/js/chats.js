async function markChatAsRead(chatId) {
    const response = await authFetch(`/chats/${chatId}/read`, {
        method: "PATCH"
    });

    if (!response) {
        return;
    }

    if (!response.ok) {
        const data = await response.json();
        console.error("Mark as read error:", data);
        return;
    }

    updateChatUnreadBadge(chatId, 0);

    const chat = currentChats.find((item) => {
        return Number(item.chat_id) === Number(chatId);
    });

    if (chat) {
        chat.unread_count = 0;
    }
}

function updateChatUnreadBadge(chatId, unreadCount) {
    const chatButton = document.querySelector(
        `.chat-item[data-chat-id="${chatId}"]`
    );

    if (!chatButton) {
        return;
    }

    const badge = chatButton.querySelector(".chat-unread-badge");

    if (!badge) {
        return;
    }

    const count = Number(unreadCount || 0);

    if (count <= 0) {
        badge.classList.add("hidden");
        badge.textContent = "0";
        return;
    }

    badge.classList.remove("hidden");
    badge.textContent = count > 99 ? "99+" : String(count);
}

function getMessageSenderId(message) {
    return message?.sender?.id || message?.sender_id || null;
}

function getChatPreviewParts(message) {
    if (!message) {
        return {
            prefix: "",
            text: "No messages yet"
        };
    }

    const currentUserId = getCurrentUserId();
    const senderId = getMessageSenderId(message);
    const isMine = Number(senderId) === Number(currentUserId);

    return {
        prefix: isMine ? "You: " : "",
        text: message.text || "New message"
    };
}

function renderChatHeader(chatId) {
    const chat = chatsById.get(Number(chatId));

    if (!chat) {
        chatHeader.classList.add("hidden");
        return;
    }

    const partnerName = chat.partner?.name || "Unknown user";

    chatHeaderAvatar.textContent = getInitials(partnerName);
    chatHeaderName.textContent = partnerName;
    chatHeaderSubtitle.textContent = `Chat ID: ${chatId}`;
    chatHeaderSubtitle.classList.remove("typing");

    chatHeader.classList.remove("hidden");
}

function getDefaultChatSubtitle() {
    if (!currentChatId) {
        return "No chat selected";
    }

    return `Chat ID: ${currentChatId}`;
}

async function openSavedOrFirstChat() {
    if (currentChatId) {
        return;
    }

    const savedChatId = localStorage.getItem("selected_chat_id");

    if (savedChatId) {
        const savedChatButton = document.querySelector(
            `.chat-item[data-chat-id="${savedChatId}"]`
        );

        if (savedChatButton) {
            await openChat(Number(savedChatId), savedChatButton);
            return;
        }
    }

    const firstChatButton = document.querySelector(".chat-item");

    if (!firstChatButton) {
        return;
    }

    const firstChatId = firstChatButton.dataset.chatId;

    if (!firstChatId) {
        return;
    }

    await openChat(Number(firstChatId), firstChatButton);
}

async function openSavedOrFirstChatOnlyDesktop() {
    if (isMobileLayout()) {
        resetMobileChatView();
        return;
    }

    await openSavedOrFirstChat();
}

function openNewChatModal() {
    newChatStatus.textContent = "";
    newChatUserInput.value = "";

    newChatModal.classList.remove("hidden");
    newChatUserInput.focus();
}

function closeNewChatModal() {
    newChatModal.classList.add("hidden");

    newChatUserInput.value = "";
    newChatStatus.textContent = "";

    userSearchResults.innerHTML = "";
    if (userSearchTimeout) {
        clearTimeout(userSearchTimeout);
        userSearchTimeout = null;
    }
}

async function loadMoreChats() {
    if (!chatsHasMore || !chatsNextCursor || isLoadingMoreChats) {
        return;
    }

    isLoadingMoreChats = true;

    const params = new URLSearchParams({
        limit: "50",
        cursor_updated_at: chatsNextCursor.created_at,
        cursor_id: String(chatsNextCursor.id)
    });

    try {
        const response = await authFetch(`/chats/?${params.toString()}`, {
            method: "GET"
        });

        if (!response) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error("Failed to load more chats:", data);
            return;
        }

        const newChats = data.items || [];

        chatsNextCursor = data.next_cursor;
        chatsHasMore = data.has_more;

        const existingChatIds = new Set(
            currentChats.map((chat) => Number(chat.chat_id))
        );

        const uniqueNewChats = newChats.filter((chat) => {
            return !existingChatIds.has(Number(chat.chat_id));
        });

        currentChats = [
            ...currentChats,
            ...uniqueNewChats
        ];

        renderChats(currentChats);

    } catch (error) {
        console.error("Load more chats error:", error);
    } finally {
        isLoadingMoreChats = false;
    }
}

function renderChats(chats) {
    chatsById.clear();
    const chatListElement = document.getElementById('chat-list');
    chatListElement.innerHTML = '';

    if (!chats || chats.length === 0) {
        chatListElement.innerHTML = `
            <div class="empty-chats">
                <div class="empty-icon">💬</div>
                <p>No conversations yet</p>
                <span>Your messages will appear here</span>
            </div>
        `;
        return;
    }

    chats.forEach((chat) => {
        chatsById.set(Number(chat.chat_id), chat);
        const chatButton = document.createElement("button");
        chatButton.className = "chat-item";
        chatButton.dataset.chatId = chat.chat_id;

        if (Number(chat.chat_id) === Number(currentChatId)) {
            chatButton.classList.add("active");
        }

        const partnerName = chat.partner?.name || "Unknown user";
        const preview = getChatPreviewParts(chat.last_message);
        const unreadCount = Number(chat.unread_count || 0);

        chatButton.innerHTML = `
            <div class="chat-icon">
                ${getInitials(partnerName)}
            </div>

            <div class="chat-info">
                <div class="chat-name">${escapeHTML(partnerName)}</div>

                <div class="chat-preview">
                    ${preview.prefix ? `<span class="prefix">${preview.prefix}</span>` : ""}
                    ${escapeHTML(preview.text)}
                </div>
            </div>

            <div class="chat-unread-badge ${unreadCount > 0 ? "" : "hidden"}">
                ${unreadCount > 99 ? "99+" : unreadCount}
            </div>
        `;

        chatButton.addEventListener("click", async () => {
            document.querySelectorAll('.chat-item').forEach(btn => btn.classList.remove('active'));
            chatButton.classList.add('active');

            await openChat(chat.chat_id, chatButton);
        });

        chatListElement.appendChild(chatButton);
    });
}

async function loadChats() {
    try {
        const response = await authFetch("/chats/?limit=50", {
            method: "GET"
        });

        if (!response) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            console.error("Load chats error:", data);
            return;
        }

        currentChats = data.items || [];
        chatsNextCursor = data.next_cursor;
        chatsHasMore = data.has_more;

        renderChats(currentChats);

    } catch (error) {
        console.error("Failed to load chats:", error);
    }
}

async function openChat(chatId, chatButton) {
    saveCurrentMessageDraft();

    currentChatId = chatId;
    localStorage.setItem("selected_chat_id", String(chatId));

    renderChatHeader(chatId);
    hideTypingIndicator();

    messageForm.classList.remove("hidden");
    restoreMessageDraft(chatId);

    openMobileChatView();

    document.querySelectorAll(".chat-item").forEach((button) => {
        button.classList.remove("active");
    });

    chatButton.classList.add("active");

    await loadMessages(chatId);
    await markChatAsRead(chatId);

    connectChatSocket(chatId);
}

async function createChat(userId) {
    if (isCreatingChat) {
        return;
    }

    isCreatingChat = true;
    newChatStatus.textContent = "Creating chat...";

    try {
        const response = await authFetch(`/chats/${userId}`, {
            method: "POST"
        });

        if (!response) {
            return;
        }

        const data = await response.json();

        console.log("Create chat response:", data);

        if (!response.ok) {
            newChatStatus.textContent = data.detail || "Failed to create chat";
            showToast(data.detail || "Failed to create chat", "error");
            return;
        }

        closeNewChatModal();

        await loadChats();

        const createdChatButton = document.querySelector(
            `.chat-item[data-chat-id="${data.chat_id}"]`
        );

        if (createdChatButton) {
            await openChat(data.chat_id, createdChatButton);
        }

        showToast("Chat opened", "success");

    } catch (error) {
        console.error("Create chat error:", error);
        newChatStatus.textContent = "Failed to connect to server";
        showToast("Failed to connect to server", "error");

    } finally {
        isCreatingChat = false;
    }
}

function getCurrentChatPartner() {
    if (!currentChatId) {
        return null;
    }

    const chat = chatsById.get(Number(currentChatId));

    if (!chat || !chat.partner) {
        return null;
    }

    return chat.partner;
}
