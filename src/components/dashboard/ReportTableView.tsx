"use client";

import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import type { ReportTable } from "@/lib/reports";

interface ReportTableViewProps {
  table: ReportTable;
}

/**
 * Shows any report: its name and what it covers, the notes a reader should
 * see, the rows and the closing totals. Every report has this one shape, so
 * adding a report never needs a new viewer.
 */
export default function ReportTableView({ table }: ReportTableViewProps) {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{table.title}</Typography>
      {table.subtitle && (
        <Typography variant="body2" color="text.secondary">{table.subtitle}</Typography>
      )}
      {table.notes.map((note) => (
        <Typography key={note} variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {note}
        </Typography>
      ))}

      <TableContainer sx={{ mt: 2, maxHeight: "65vh", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
        <Table size="small" stickyHeader aria-label={table.title}>
          <TableHead>
            <TableRow>
              {table.columns.map((column) => (
                <TableCell key={column.key} align={column.align ?? "left"} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {table.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={table.columns.length} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">There is nothing to report for this selection.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              table.rows.map((row, index) => (
                <TableRow key={index} hover>
                  {table.columns.map((column) => (
                    <TableCell key={column.key} align={column.align ?? "left"} sx={{ whiteSpace: "nowrap" }}>
                      {row[column.key] ?? ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
            {table.totals && (
              <TableRow sx={{ "& td": { fontWeight: 700, backgroundColor: "action.hover" } }}>
                {table.columns.map((column) => (
                  <TableCell key={column.key} align={column.align ?? "left"} sx={{ whiteSpace: "nowrap" }}>
                    {table.totals?.[column.key] ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
