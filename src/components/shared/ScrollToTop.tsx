"use client";

import { useEffect, useState } from "react";
import { Fab, Tooltip, Zoom } from "@mui/material";
import { KeyboardArrowUp } from "@mui/icons-material";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Zoom in={visible}>
      <Tooltip title="Back to top" placement="left">
        <Fab
          size="small"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          sx={{
            position: "fixed",
            bottom: 90,
            right: 88,
            zIndex: 1300,
            backgroundColor: "background.paper",
            color: "text.secondary",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: 2,
            "&:hover": { backgroundColor: "primary.main", color: "#fff", borderColor: "primary.main" },
            transition: "all 0.2s",
          }}
        >
          <KeyboardArrowUp />
        </Fab>
      </Tooltip>
    </Zoom>
  );
}
