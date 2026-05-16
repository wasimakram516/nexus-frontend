"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";

type FeatureSectionNavItem = {
  id: string;
  label: string;
  number: number;
};

interface Props {
  items: FeatureSectionNavItem[];
  boundaryId: string;
}

const STICKY_TOP = 120;

export default function FeatureSectionNav({ items, boundaryId }: Props) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [mode, setMode] = useState<"static" | "fixed" | "bottom">("static");
  const [navWidth, setNavWidth] = useState<number>();
  const [navHeight, setNavHeight] = useState<number>();
  const [navLeft, setNavLeft] = useState<number>();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!headings.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              right.intersectionRatio - left.intersectionRatio ||
              left.boundingClientRect.top - right.boundingClientRect.top,
          );

        if (visibleEntries[0]?.target.id) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: `-${STICKY_TOP + 40}px 0px -55% 0px`,
        threshold: [0.15, 0.35, 0.6],
      },
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [items]);

  const itemMap = useMemo(
    () => new Map(items.map((item) => [item.id, item] as const)),
    [items],
  );

  useEffect(() => {
    const onScroll = () => {
      const candidate = items.findLast((item) => {
        const element = document.getElementById(item.id);
        if (!element) {
          return false;
        }

        const top = element.getBoundingClientRect().top;
        return top <= STICKY_TOP + 80;
      });

      if (candidate?.id) {
        setActiveId(candidate.id);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  useEffect(() => {
    const updatePosition = () => {
      const wrapper = wrapperRef.current;
      const nav = navRef.current;
      const boundary = document.getElementById(boundaryId);

      if (!wrapper || !nav || !boundary) {
        return;
      }

      const wrapperRect = wrapper.getBoundingClientRect();
      const boundaryRect = boundary.getBoundingClientRect();
      const currentNavHeight = nav.offsetHeight;

      setNavWidth(wrapperRect.width);
      setNavHeight(currentNavHeight);
      setNavLeft(wrapperRect.left);

      const start = window.scrollY + wrapperRect.top - STICKY_TOP;
      const end = window.scrollY + boundaryRect.bottom - STICKY_TOP - currentNavHeight;

      if (window.scrollY < start) {
        setMode("static");
        return;
      }

      if (window.scrollY >= end) {
        setMode("bottom");
        return;
      }

      setMode("fixed");
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [boundaryId]);

  return (
    <Box
      ref={wrapperRef}
      sx={{
        position: "relative",
        minHeight: navHeight ? `${navHeight}px` : undefined,
      }}
    >
      <Box
        ref={navRef}
        sx={{
          position: mode === "fixed" ? "fixed" : mode === "bottom" ? "absolute" : "relative",
          top: mode === "fixed" ? STICKY_TOP : mode === "bottom" ? "auto" : 0,
          bottom: mode === "bottom" ? 0 : "auto",
          width: mode === "fixed" ? navWidth : "100%",
          left: mode === "fixed" ? navLeft : 0,
        }}
      >
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            display: "block",
            mb: 2,
          }}
        >
          In this section
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {items.map((item) => {
            const isActive = item.id === activeId;

            return (
              <Box
                key={item.id}
                role="button"
                tabIndex={0}
                aria-current={isActive ? "true" : undefined}
                onClick={() =>
                  document
                    .getElementById(item.id)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    document
                      .getElementById(item.id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  p: 1.25,
                  borderRadius: 2.5,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: isActive ? "primary.main" : "divider",
                  backgroundColor: isActive ? "rgba(5,150,105,0.08)" : "background.paper",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    backgroundColor: "rgba(5,150,105,0.08)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: 2,
                  },
                }}
              >
                <Chip
                  label={item.number}
                  size="small"
                  color={isActive ? "primary" : "default"}
                  sx={{
                    minWidth: 36,
                    fontWeight: 800,
                    mt: 0.15,
                  }}
                />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? "text.primary" : "text.secondary",
                      lineHeight: 1.6,
                    }}
                  >
                    {itemMap.get(item.id)?.label}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
