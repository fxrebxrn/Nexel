// ui.js
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
    if (myUserIdElement) {
        myUserIdElement.textContent = "—";
    }
}

function setAuthStatus(message) {
    authStatus.textContent = message;
}

function showChatApp() {
    authScreen.classList.add("hidden");
    chatApp.classList.remove("hidden");
    renderMyUserId();
}

function renderMyUserId() {
    const userId = getCurrentUserId();

    if (!userId) {
        myUserIdElement.textContent = "—";
        return;
    }

    myUserIdElement.textContent = String(userId);
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

    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    document.execCommand("copy");

    document.body.removeChild(textarea);
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
