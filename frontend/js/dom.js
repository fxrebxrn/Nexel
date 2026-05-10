// dom.js
const authScreen = document.getElementById("auth-screen");
const chatApp = document.getElementById("chat-app");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const showLoginButton = document.getElementById("show-login-button");
const showRegisterButton = document.getElementById("show-register-button");
const loginEmailInput = document.getElementById("login-email-input");
const loginPasswordInput = document.getElementById("login-password-input");
const registerNameInput = document.getElementById("register-name-input");
const registerEmailInput = document.getElementById("register-email-input");
const registerPasswordInput = document.getElementById("register-password-input");
const loginButton = document.getElementById("login-button");
const registerButton = document.getElementById("register-button");
const logoutButton = document.querySelector(".logout-button");
const slider = document.querySelector(".slider");
const authStatus = document.getElementById("auth-status");

const chatList = document.querySelector(".chat-list");
const messagesList = document.getElementById("messages-list");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const newChatButton = document.querySelector(".new-chat-button");
const newChatModal = document.getElementById("new-chat-modal");
const newChatUserInput = document.getElementById("new-chat-user-input");
const newChatStatus = document.getElementById("new-chat-status");
const cancelNewChatButton = document.getElementById("cancel-new-chat-button");
const createNewChatButton = document.getElementById("create-new-chat-button");
const chatHeader = document.getElementById("chat-header");
const chatHeaderAvatar = document.getElementById("chat-header-avatar");
const chatHeaderName = document.getElementById("chat-header-name");
const chatHeaderSubtitle = document.getElementById("chat-header-subtitle");
const sendButton = document.getElementById("send-button");

const toastContainer = document.getElementById("toast-container");

const chatHeaderStatus = document.getElementById("chat-header-status");

const myIdBox = document.getElementById("my-id-box");
const myUserIdElement = document.getElementById("my-user-id");

const mobileBackButton = document.getElementById("mobile-back-button");