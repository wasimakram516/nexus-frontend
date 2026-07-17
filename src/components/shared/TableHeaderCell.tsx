"use client";

import { TableCell, TableCellProps } from "@mui/material";

/** Bold table header cell — the fontWeight:700 idiom repeated across every manager's table head. */
export default function TableHeaderCell({ sx, ...props }: TableCellProps) {
  return <TableCell sx={{ fontWeight: 700, ...sx }} {...props} />;
}
