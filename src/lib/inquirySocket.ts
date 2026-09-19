import { io, type Socket } from "socket.io-client";
import env from "@/config/env";

/** Payload of the `inquiry.created` event (minimal by design, no contact details). */
export interface InquiryCreatedEvent {
  id: string;
  name: string;
  inquiryType: string;
  createdAt: string;
}

type Handler = (event: InquiryCreatedEvent) => void;

const TOKEN_KEY = "nexus-token";
const EVENT_NAME = "inquiry.created";

let socket: Socket | null = null;
const handlers = new Set<Handler>();

/**
 * Reads the current access token (same storage the axios client uses).
 * @returns {string} The token, or an empty string when none/unavailable.
 */
function getToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Opens the single shared socket to `<API origin>/realtime`. `auth` is a
 * function so every (re)connect sends the freshest token. Connection errors
 * are swallowed on purpose: the REST fallback keeps the UI correct.
 */
function connect(): void {
  socket = io(`${env.apiBaseUrl}/realtime`, {
    auth: (cb) => cb({ token: getToken() }),
    transports: ["websocket", "polling"],
    reconnectionDelayMax: 60000,
  });
  socket.on("connect_error", () => undefined);
  socket.on(EVENT_NAME, (event: InquiryCreatedEvent) => {
    handlers.forEach((handler) => handler(event));
  });
}

/**
 * Subscribes to live inquiry alerts over one ref-counted shared connection.
 * Does nothing (returns a no-op unsubscribe) when there is no access token.
 *
 * @param {Handler} handler Called for every `inquiry.created` event.
 * @returns {() => void} Unsubscribe; closes the socket when the last handler leaves.
 */
export function subscribeInquiryCreated(handler: Handler): () => void {
  if (typeof window === "undefined" || !getToken()) return () => undefined;
  handlers.add(handler);
  if (!socket) connect();
  return () => {
    handlers.delete(handler);
    if (handlers.size === 0 && socket) {
      socket.off();
      socket.disconnect();
      socket = null;
    }
  };
}
