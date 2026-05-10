// main.js
showLoginButton.addEventListener("click", () => {
    showLoginForm();
});

showRegisterButton.addEventListener("click", () => {
    showRegisterForm();
});

loginButton.addEventListener("click", async () => {
    await login();
});

registerButton.addEventListener("click", async () => {
    await register();
});

logoutButton.addEventListener("click", () => {
    logoutUser();
});

newChatButton.addEventListener("click", () => {
    openNewChatModal();
});

cancelNewChatButton.addEventListener("click", () => {
    closeNewChatModal();
});

newChatModal.addEventListener("click", (event) => {
    if (event.target === newChatModal) {
        closeNewChatModal();
    }
});

createNewChatButton.addEventListener("click", async () => {
    const userId = Number(newChatUserInput.value.trim());

    if (!userId) {
        newChatStatus.textContent = "Enter user ID";
        return;
    }

    await createChat(userId);
});

messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentChatId) {
        showToast("No chat selected", "error");
        return;
    }

    const text = messageInput.value.trim();

    if (!text) {
        return;
    }

    await sendMessage(currentChatId, text);

    messageInput.value = "";
});

sendButton.addEventListener("touchstart", (event) => {
    event.preventDefault();

    if (!currentChatId) {
        return;
    }

    messageForm.requestSubmit();
}, { passive: false });

sendButton.addEventListener("mousedown", (event) => {
    event.preventDefault();
});

messagesList.addEventListener("scroll", () => {
    if (messagesList.scrollTop <= MESSAGES_LOAD_THRESHOLD) {
        loadOlderMessages();
    }
});

chatList.addEventListener("scroll", async () => {
    const scrollBottom = chatList.scrollTop + chatList.clientHeight;

    if (scrollBottom >= chatList.scrollHeight - 40) {
        await loadMoreChats();
    }
});

messageInput.addEventListener("input", () => {
    messageInput.style.height = "40px";

    const newHeight = Math.min(messageInput.scrollHeight, 110);
    messageInput.style.height = `${newHeight}px`;

    resizeMessageInput();
    saveCurrentMessageDraft();

    if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) {
        return;
    }

    if (!currentChatId) {
        return;
    }

    const now = Date.now();

    if (now - lastTypingSentAt < 1200) {
        return;
    }

    chatSocket.send(JSON.stringify({
        type: "typing"
    }));

    lastTypingSentAt = now;
});

if (mobileBackButton) {
    mobileBackButton.addEventListener("click", () => {
        saveCurrentMessageDraft();
        closeMobileChatView();

        if (isMobileLayout()) {
            currentChatId = null;
            closeChatSocket();

            chatHeader.classList.add("hidden");
            messageForm.classList.add("hidden");

            messagesList.innerHTML = `
                <div class="message-list-empty">
                    Select a chat to start messaging
                </div>
            `;
        }
    });
}

messageInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
        return;
    }

    if (event.shiftKey) {
        return;
    }

    event.preventDefault();

    if (!messageInput.value.trim()) {
        return;
    }

    messageForm.requestSubmit();
});

myIdBox.addEventListener("click", async () => {
    const userId = getCurrentUserId();

    if (!userId) {
        renderMyUserId();
        return;
    }

    try {
        await copyTextToClipboard(String(userId));

        if (copyIdTimeout) {
            clearTimeout(copyIdTimeout);
            copyIdTimeout = null;
        }

        myUserIdElement.textContent = "Copied!";
        myIdBox.classList.add("copied");

        copyIdTimeout = setTimeout(() => {
            renderMyUserId();
            myIdBox.classList.remove("copied");
            copyIdTimeout = null;
        }, 1500);

    } catch (error) {
        console.error("Failed to copy user ID:", error);
    }
});

window.addEventListener("resize", () => {
    if (!isMobileLayout()) {
        chatApp.classList.remove("mobile-chat-open");
    }
});

async function initApp() {
    const savedToken = localStorage.getItem("access_token");

    if (savedToken) {
        await loadChats();
        showChatApp();
        await openSavedOrFirstChatOnlyDesktop();
    } else {
        showAuthScreen();
    }
}

initApp();
