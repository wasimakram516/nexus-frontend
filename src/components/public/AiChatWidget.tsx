"use client";

import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Fab,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Close, Send, SmartToy } from "@mui/icons-material";
import NexusLogo from "@/components/shared/NexusLogo";
import { AI_POSITIONING } from "@/content/ai";
import { getResponse } from "@/lib/chatEngine";
import env from "@/config/env";
import { playClose, playOpen, playReceive, playSend } from "@/lib/chatSounds";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+)/g;
const URL_PART_REGEX = /^https?:\/\/[^\s]+$/;

function MessageContent({ content, isUser }: { content: string; isUser: boolean }) {
  const parts = content.split(URL_SPLIT_REGEX);
  return (
    <Typography
      variant="body2"
      sx={{ color: isUser ? "#fff" : "text.primary", lineHeight: 1.7, wordBreak: "break-word" }}
    >
      {parts.map((part, i) => {
        if (URL_PART_REGEX.test(part)) {
          const isInternal = part.startsWith(env.nexusUrl);
          const label = isInternal
            ? part.replace(env.nexusUrl, "").replace(/^\//, "") || "nexus.wisemensoft.com"
            : part.replace(/^https?:\/\//, "").replace(/\/$/, "");
          return (
            <Box
              key={i}
              component="a"
              href={part}
              target={isInternal ? "_self" : "_blank"}
              rel="noopener noreferrer"
              sx={{
                color: isUser ? "rgba(255,255,255,0.9)" : "primary.main",
                textDecoration: "underline",
                fontWeight: 500,
                fontSize: "inherit",
                display: "inline",
                wordBreak: "break-all",
              }}
            >
              {label}
            </Box>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </Typography>
  );
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "Hi! I'm Nexus AI. I provide AI-powered assistance for Nexus questions, from features and pricing to rollout direction, demos, and how the platform is evolving.",
  suggestions: [
    "What is Nexus?",
    "Show me pricing",
    "What features does Nexus have?",
    "How do I get a demo?",
  ],
};

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || typing) return;
    playSend();
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const { reply, suggestions } = getResponse(text);
    setMessages((prev) => [...prev, { role: "assistant", content: reply, suggestions }]);
    playReceive();
    setTyping(false);
  };

  return (
    <>
      {open && (
        <Paper
          elevation={12}
          sx={{
            position: "fixed",
            bottom: 90,
            right: 24,
            width: { xs: "calc(100vw - 48px)", sm: 380 },
            height: 520,
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1300,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              background: "linear-gradient(135deg, #059669, #047857)",
              px: 2.5,
              py: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, backgroundColor: "rgba(255,255,255,0.2)" }}>
                <SmartToy sx={{ fontSize: 18, color: "#fff" }} />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: "#fff", fontWeight: 700, lineHeight: 1.2 }}>
                  {AI_POSITIONING.chatTitle}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                  {AI_POSITIONING.chatSubtext}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "#fff" }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 2,
              py: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            {messages.map((msg, i) => (
              <Box key={i}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    gap: 1,
                    alignItems: "flex-end",
                  }}
                >
                  {msg.role === "assistant" && (
                    <Avatar sx={{ width: 26, height: 26, backgroundColor: "primary.main", flexShrink: 0 }}>
                      <SmartToy sx={{ fontSize: 14 }} />
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      maxWidth: "80%",
                      px: 2,
                      py: 1.2,
                      borderRadius:
                        msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      backgroundColor: msg.role === "user" ? "primary.main" : "background.default",
                      border: msg.role === "assistant" ? "1px solid" : "none",
                      borderColor: "divider",
                    }}
                  >
                    <MessageContent content={msg.content} isUser={msg.role === "user"} />
                  </Box>
                </Box>

                {msg.role === "assistant" &&
                msg.suggestions &&
                msg.suggestions.length > 0 &&
                i === messages.length - 1 ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1, ml: 4.5 }}>
                    {msg.suggestions.map((s) => (
                      <Box
                        key={s}
                        onClick={() => sendMessage(s)}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 10,
                          border: "1px solid",
                          borderColor: "primary.main",
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "primary.main", "& span": { color: "#fff" } },
                          transition: "all 0.15s",
                        }}
                      >
                        <Typography component="span" variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                          {s}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : null}
              </Box>
            ))}

            {typing && (
              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
                <Avatar sx={{ width: 26, height: 26, backgroundColor: "primary.main", flexShrink: 0 }}>
                  <SmartToy sx={{ fontSize: 14 }} />
                </Avatar>
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderRadius: "16px 16px 16px 4px",
                    backgroundColor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    gap: 0.5,
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "primary.main",
                        animation: "bounce 1.2s infinite",
                        animationDelay: `${i * 0.2}s`,
                        "@keyframes bounce": {
                          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: 0.4 },
                          "40%": { transform: "scale(1)", opacity: 1 },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <div ref={bottomRef} />
          </Box>

          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              gap: 1,
              alignItems: "flex-end",
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Ask about Nexus..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              multiline
              maxRows={3}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
            />
            <IconButton
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              size="small"
              sx={{
                backgroundColor: "primary.main",
                color: "#fff",
                "&:hover": { backgroundColor: "primary.dark" },
                "&.Mui-disabled": { backgroundColor: "action.disabledBackground" },
                flexShrink: 0,
                mb: 0.25,
              }}
            >
              <Send fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              px: 2,
              py: 0.75,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            <Typography variant="caption" color="text.disabled">
              Part of the Nexus AI-assisted experience
            </Typography>
            <NexusLogo size={12} variant="full" />
          </Box>
        </Paper>
      )}

      <Tooltip title={AI_POSITIONING.chatTooltip} placement="left">
        <Fab
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) {
              playOpen();
            } else {
              playClose();
            }
          }}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 1300,
            background: "linear-gradient(135deg, #059669, #047857)",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(5, 150, 105, 0.4)",
            "&:hover": { background: "linear-gradient(135deg, #047857, #065f46)" },
          }}
        >
          {open ? <Close /> : <SmartToy />}
        </Fab>
      </Tooltip>
    </>
  );
}
