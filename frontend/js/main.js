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

accountButton.addEventListener("click", () => {
    renderAccountInfo();
    accountModal.classList.remove("hidden");
});

closeAccountModalButton.addEventListener("click", () => {
    accountModal.classList.add("hidden");
});

accountModal.addEventListener("click", (event) => {
    if (event.target === accountModal) {
        accountModal.classList.add("hidden");
    }
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

window.addEventListener("resize", () => {
    if (!isMobileLayout()) {
        chatApp.classList.remove("mobile-chat-open");
    }
});

newChatUserInput.addEventListener("input", () => {
    const query = newChatUserInput.value.trim();

    newChatStatus.textContent = "";

    if (query.length < 3) {
        userSearchResults.innerHTML = `
            <div class="user-search-empty">
                Type at least 3 characters
            </div>
        `;
        return;
    }

    debounceUserSearch(async () => {
        userSearchResults.innerHTML = `
            <div class="user-search-empty">
                Searching...
            </div>
        `;

        const users = await searchUsers(query);
        renderUserSearchResults(users);
    });
});

if (copyAccountIdButton) {
    copyAccountIdButton.addEventListener("click", async () => {
        const userId = getCurrentUserId();

        if (!userId) {
            showToast("User ID not found", "error");
            return;
        }

        try {
            await copyTextToClipboard(String(userId));

            if (copyIdTimeout) {
                clearTimeout(copyIdTimeout);
                copyIdTimeout = null;
            }

            copyAccountIdButton.textContent = "Copied!";

            copyIdTimeout = setTimeout(() => {
                copyAccountIdButton.textContent = "Copy User ID";
                copyIdTimeout = null;
            }, 1500);

        } catch (error) {
            console.error("Failed to copy user ID:", error);
            showToast("Failed to copy ID", "error");
        }
    });
}

if (openProfileButton) {
    openProfileButton.addEventListener("click", () => {
        showToast("Profile page will be added later", "warning");
    });
}

if (chatHeader) {
    chatHeader.addEventListener("click", (event) => {
        if (event.target.closest(".mobile-back-button")) {
            return;
        }

        if (!currentChatId) {
            return;
        }

        openPartnerProfileModal();
    });
}

if (closePartnerProfileButton) {
    closePartnerProfileButton.addEventListener("click", () => {
        closePartnerProfileModal();
    });
}

if (partnerProfileModal) {
    partnerProfileModal.addEventListener("click", (event) => {
        if (event.target === partnerProfileModal) {
            closePartnerProfileModal();
        }
    });
}

if (copyPartnerIdButton) {
    copyPartnerIdButton.addEventListener("click", async () => {
        const partner = getCurrentChatPartner();

        if (!partner || !partner.id) {
            showToast("User ID not found", "error");
            return;
        }

        try {
            await copyTextToClipboard(String(partner.id));

            copyPartnerIdButton.textContent = "Copied!";

            setTimeout(() => {
                copyPartnerIdButton.textContent = "Copy User ID";
            }, 1500);

        } catch (error) {
            console.error("Failed to copy partner ID:", error);
            showToast("Failed to copy ID", "error");
        }
    });
}

if (openPartnerProfileButton) {
    openPartnerProfileButton.addEventListener("click", () => {
        showToast("Profile page will be added later", "warning");
    });
}

async function initApp() {
    const savedToken = localStorage.getItem("access_token");

    if (savedToken) {
        await loadCurrentUser();
        await loadChats();

        showChatApp();

        await openSavedOrFirstChatOnlyDesktop();
    } else {
        showAuthScreen();
    }
}

initApp();
