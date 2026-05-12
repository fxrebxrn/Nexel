function showToast(message, type = "info") {
    if (!toastContainer) {
        return;
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showAuthScreen() {
    chatApp.classList.add("hidden");
    authScreen.classList.remove("hidden");
}

function setAuthStatus(message) {
    authStatus.textContent = message;
}

function showChatApp() {
    authScreen.classList.add("hidden");
    chatApp.classList.remove("hidden");
    renderAccountInfo();
}

function showLoginForm() {
    loginForm.classList.remove("hidden");
    loginForm.classList.add("form-fade-in");
    registerForm.classList.add("hidden");

    showLoginButton.classList.add("active");
    showRegisterButton.classList.remove("active");

    setAuthStatus("");
}

function showRegisterForm() {
    registerForm.classList.remove("hidden");
    registerForm.classList.add("form-fade-in");
    loginForm.classList.add("hidden");

    showRegisterButton.classList.add("active");
    showLoginButton.classList.remove("active");

    setAuthStatus("");
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function hideTypingIndicator() {
    if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
    }

    chatHeaderSubtitle.textContent = getDefaultChatSubtitle();
    chatHeaderSubtitle.classList.remove("typing");
}

function showTypingIndicator() {
    if (!currentChatId) {
        return;
    }

    chatHeaderSubtitle.innerHTML = `
        Typing<span class="header-typing-dots"><span>.</span><span>.</span><span>.</span></span>
    `;

    chatHeaderSubtitle.classList.add("typing");

    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    typingTimeout = setTimeout(() => {
        chatHeaderSubtitle.textContent = getDefaultChatSubtitle();
        chatHeaderSubtitle.classList.remove("typing");
        typingTimeout = null;
    }, 1500);
}

function getInitials(name) {
    if (!name) {
        return "?";
    }

    return name
        .trim()
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

function renderAccountInfo() {
    const userId = getCurrentUserId();

    if (!accountAvatar || !accountUserId) {
        return;
    }

    if (!currentUser) {
        const fallbackId = userId || "—";

        accountAvatar.textContent = userId ? String(userId).slice(0, 2) : "U";
        accountUserId.textContent = String(fallbackId);

        if (accountProfileAvatar) {
            accountProfileAvatar.textContent = "U";
        }

        if (accountProfileName) {
            accountProfileName.textContent = "User";
        }

        if (accountProfileEmail) {
            accountProfileEmail.textContent = `ID: ${fallbackId}`;
        }

        return;
    }

    const name = currentUser.name || "User";
    const id = currentUser.id || userId || "—";

    accountAvatar.textContent = getInitials(name);
    accountUserId.textContent = String(id);

    if (accountProfileAvatar) {
        accountProfileAvatar.textContent = getInitials(name);
    }

    if (accountProfileName) {
        accountProfileName.textContent = name;
    }

    if (accountProfileEmail) {
        accountProfileEmail.textContent = `ID: ${id}`;
    }
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");

    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = document.execCommand("copy");

    document.body.removeChild(textarea);

    if (!copied) {
        throw new Error("Copy command failed");
    }
}

function openNewChatModal() {
    newChatStatus.textContent = "";
    newChatUserInput.value = "";

    userSearchResults.innerHTML = `
        <div class="user-search-empty">
            Type at least 3 characters
        </div>
    `;

    newChatModal.classList.remove("hidden");

    setTimeout(() => {
        newChatUserInput.focus();
    }, 50);
}

function isSameDay(dateA, dateB) {
    if (!dateA || !dateB) {
        return false;
    }

    return (
        dateA.getFullYear() === dateB.getFullYear() &&
        dateA.getMonth() === dateB.getMonth() &&
        dateA.getDate() === dateB.getDate()
    );
}

function getDateSeparatorLabel(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const today = new Date();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) {
        return "Today";
    }

    if (isSameDay(date, yesterday)) {
        return "Yesterday";
    }

    return date.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function createDateSeparator(label) {
    const separator = document.createElement("div");
    separator.className = "date-separator";
    separator.textContent = label;

    return separator;
}

function openPartnerProfileModal() {
    const partner = getCurrentChatPartner();

    if (!partner) {
        showToast("Partner not found", "error");
        return;
    }

    const partnerName = partner.name || "Unknown user";
    const partnerId = partner.id;

    partnerProfileAvatar.textContent = getInitials(partnerName);
    partnerProfileName.textContent = partnerName;
    partnerProfileId.textContent = partnerId ? String(partnerId) : "—";

    partnerProfileModal.classList.remove("hidden");
}

function closePartnerProfileModal() {
    partnerProfileModal.classList.add("hidden");
}
