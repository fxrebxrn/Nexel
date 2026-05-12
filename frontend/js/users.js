async function searchUsers(name) {
    const params = new URLSearchParams({
        limit: "10",
        offset: "0"
    });

    const response = await authFetch(
        `/users/search/${encodeURIComponent(name)}?${params.toString()}`,
        {
            method: "GET"
        }
    );

    if (!response) {
        return [];
    }

    const data = await response.json();

    if (!response.ok) {
        console.error("Search users error:", data);
        newChatStatus.textContent = data.detail || "Failed to search users";
        return [];
    }

    return data;
}

function renderUserSearchResults(users) {
    userSearchResults.innerHTML = "";

    if (!users || users.length === 0) {
        userSearchResults.innerHTML = `
            <div class="user-search-empty">
                No users found
            </div>
        `;
        return;
    }

    users.forEach((user) => {
        const button = document.createElement("button");
        button.className = "user-search-item";
        button.type = "button";

        button.innerHTML = `
            <div class="user-search-avatar">
                ${getInitials(user.name || "User")}
            </div>

            <div class="user-search-info">
                <div class="user-search-name">${escapeHTML(user.name || "Unknown user")}</div>
                <div class="user-search-email">${escapeHTML(user.email || `ID: ${user.id}`)}</div>
            </div>
        `;

        button.addEventListener("click", async () => {
            const oldHTML = button.innerHTML;

            button.disabled = true;
            button.textContent = "Opening chat...";

            try {
                await createChat(user.id);
            } finally {
                button.disabled = false;
                button.innerHTML = oldHTML;
            }
        });

        userSearchResults.appendChild(button);
    });
}

async function loadCurrentUser() {
    const response = await authFetch("/users/me/profile", {
        method: "GET"
    });

    if (!response) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        console.error("Load current user error:", data);
        showToast("Failed to load account info", "error");
        return null;
    }

    currentUser = data;
    return data;
}
