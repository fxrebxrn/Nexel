let currentChatId = null;
let chatSocket = null;
let currentMessages = [];
let copyIdTimeout = null;
let typingTimeout = null;
let lastTypingSentAt = 0;
let chatsById = new Map();
let isSendingMessage = false;
let messagesNextCursor = null;
let messagesHasMore = false;
let isLoadingMoreMessages = false;
let currentChats = [];
let chatsNextCursor = null;
let chatsHasMore = false;
let isLoadingMoreChats = false;
let messageDrafts = new Map();
let shouldReconnectSocket = true;
let reconnectTimeout = null;
let reconnectAttempts = 0;
let pendingMessageFallbackTimeouts = new Map();

function getAccessToken() {
    return localStorage.getItem("access_token");
}

function getCurrentUserId() {
    const token = getAccessToken();

    if (!token) {
        return null;
    }

    try {
        const payloadBase64 = token.split(".")[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);

        return payload.user_id;
    } catch (error) {
        console.error("Failed to parse token:", error);
        return null;
    }
}
