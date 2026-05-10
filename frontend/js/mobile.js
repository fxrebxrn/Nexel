// mobile.js
function isMobileLayout() {
    return window.matchMedia("(max-width: 768px)").matches;
}

function openMobileChatView() {
    if (!isMobileLayout()) {
        return;
    }

    chatApp.classList.add("mobile-chat-open");
}

function closeMobileChatView() {
    chatApp.classList.remove("mobile-chat-open");
}

function resetMobileChatView() {
    if (!isMobileLayout()) {
        return;
    }

    closeMobileChatView();

    currentChatId = null;

    chatHeader.classList.add("hidden");
    messageForm.classList.add("hidden");

    messagesList.innerHTML = `
        <div class="message-list-empty">
            Select a chat to start messaging
        </div>
    `;
}

function saveCurrentMessageDraft() {
    if (!currentChatId) {
        return;
    }

    const text = messageInput.value;

    if (text.trim()) {
        messageDrafts.set(String(currentChatId), text);
    } else {
        messageDrafts.delete(String(currentChatId));
    }
}

function restoreMessageDraft(chatId) {
    const draft = messageDrafts.get(String(chatId)) || "";

    messageInput.value = draft;
    resizeMessageInput();
}

function clearCurrentMessageDraft() {
    if (!currentChatId) {
        return;
    }

    messageDrafts.delete(String(currentChatId));
}

function resizeMessageInput() {
    messageInput.style.height = `${MESSAGE_INPUT_DEFAULT_HEIGHT}px`;

    if (!messageInput.value) {
        return;
    }

    const newHeight = Math.min(
        messageInput.scrollHeight,
        MESSAGE_INPUT_MAX_HEIGHT
    );

    messageInput.style.height = `${newHeight}px`;
}
