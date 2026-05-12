function logoutUser() {
    closeChatSocket(false);
    closeNewChatModal();

    currentChatId = null;
    currentMessages = [];
    currentChats = [];
    chatsById.clear();
    messageDrafts.clear();

    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    pendingMessageFallbackTimeouts.forEach((timeoutId) => {
        clearTimeout(timeoutId);
    });
    pendingMessageFallbackTimeouts.clear();

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("selected_chat_id");
    localStorage.removeItem("user_id");

    chatHeader.classList.add("hidden");
    messageForm.classList.add("hidden");

    messagesList.innerHTML = `
        <div class="message-list-empty">
            Select a chat to start messaging
        </div>
    `;

    showAuthScreen();
}

async function login() {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    if (!email || !password) {
        setAuthStatus("Enter your email and password");
        return;
    }

    try {
        const formData = new URLSearchParams();

        formData.append("username", email);
        formData.append("password", password);

        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            setAuthStatus(data.detail || "Login error");
            return;
        }

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        try {
            const meResponse = await fetch(`${API_URL}/users/me`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${data.access_token}` }
            });
            const meData = await meResponse.json();
            localStorage.setItem("user_id", meData.id);
        } catch (e) {
            console.error("Failed to save data", e);
        }

        setAuthStatus("");
        await loadCurrentUser();
        await loadChats();

        showChatApp();

        await openSavedOrFirstChatOnlyDesktop();

    } catch (error) {
        console.error("Login error:", error);
        setAuthStatus("Failed to connect to the server");
    }
}

async function register() {
    const name = registerNameInput.value;
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;

    if (!name || !email || !password) {
        setAuthStatus("Enter your name, email and password");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            setAuthStatus(data.detail || "Registration error");
            return;
        }

        setAuthStatus("Registration successful, now login please");

        registerNameInput.value = "";
        registerEmailInput.value = "";
        registerPasswordInput.value = "";

        showLoginForm();

    } catch (error) {
        console.error("Register error:", error);
        setAuthStatus("Failed to connect to the server");
    }
}
