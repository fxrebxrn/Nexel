const IS_LOCAL_FRONTEND = ["3000", "5173"].includes(window.location.port);

const API_URL = IS_LOCAL_FRONTEND
    ? "http://192.168.0.100:8000"
    : window.location.origin;

const WS_PROTOCOL = window.location.protocol === "https:" ? "wss:" : "ws:";

const WS_URL = IS_LOCAL_FRONTEND
    ? "ws://192.168.0.100:8000"
    : `${WS_PROTOCOL}//${window.location.host}`;

const MESSAGES_LOAD_THRESHOLD = 350;
const MESSAGE_INPUT_DEFAULT_HEIGHT = 40;
const MESSAGE_INPUT_MAX_HEIGHT = 110;
const MAX_RECONNECT_ATTEMPTS = 5;