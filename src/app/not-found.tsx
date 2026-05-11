import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        textAlign: "center",
        gap: 2,
        px: 2,
      }}
    >
      <Typography variant="h1" sx={{ fontWeight: 800, fontSize: "6rem", color: "primary.main" }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Page not found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </Typography>
      <Link href="/">
        <Button variant="contained" size="large" sx={{ mt: 2 }}>Go Home</Button>
      </Link>
    </Box>
  );
}
