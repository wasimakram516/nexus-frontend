"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import {
  AccountBalanceWallet,
  ArrowBack,
  Discount,
  Gavel,
  MoneyOff,
  Paid,
  Payments,
  Percent,
  PointOfSale,
  ReceiptLong,
  RequestQuote,
  SwapVert,
} from "@mui/icons-material";
import CampusRequiredNotice from "@/components/dashboard/CampusRequiredNotice";
import ResourceSection, { FieldDef, Option } from "@/components/dashboard/ResourceSection";
import { useMessage } from "@/contexts/MessageContext";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDate } from "@/lib/dateFormat";
import { fetchAllUsers, UserLite } from "@/lib/users";
import { academicsService } from "@/services/academics.service";
import { campusesService } from "@/services/campuses.service";
import { financeService } from "@/services/finance.service";
import { peopleService } from "@/services/people.service";

interface Row {
  id: string;
  [key: string]: unknown;
}

interface FinanceManagerProps {
  /** When set (superadmin context), all data is scoped to this institution. */
  institutionId?: string;
}

const MONTH_OPTIONS: Option[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2026, i, 1).toLocaleString("en", { month: "long" }),
}));

const STAFF_ROLES = ["ADMIN", "TEACHER", "ACCOUNTANT"];

export default function FinanceManager({ institutionId }: FinanceManagerProps) {
  const { showMessage } = useMessage();
  const runtime = useOptionalRuntimeConfig();
  // Platform console (institutionId set) is superadmin — always full access.
  const canManage = institutionId ? true : (runtime?.can("FINANCE", "manage") ?? true);

  // null = category hub; otherwise the label of the open section.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserLite[]>([]);
  const [campuses, setCampuses] = useState<Row[]>([]);
  const [classes, setClasses] = useState<Row[]>([]);
  const [students, setStudents] = useState<Row[]>([]);

  const [salaries, setSalaries] = useState<Row[]>([]);
  const [deductionRules, setDeductionRules] = useState<Row[]>([]);
  const [adjustments, setAdjustments] = useState<Row[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<Row[]>([]);
  const [bankAccounts, setBankAccounts] = useState<Row[]>([]);
  const [feeStructures, setFeeStructures] = useState<Row[]>([]);
  const [discounts, setDiscounts] = useState<Row[]>([]);
  const [fineRules, setFineRules] = useState<Row[]>([]);
  const [fines, setFines] = useState<Row[]>([]);
  const [vouchers, setVouchers] = useState<Row[]>([]);
  const [feePayments, setFeePayments] = useState<Row[]>([]);

  const load = useCallback(async () => {
    const list = <T,>(fn: () => Promise<{ data: { data: T } }>) =>
      apiHandler<T>(fn as never, { showMessage, silent: true });

    const [
      campusesRes, classesRes, studentsRes,
      salariesRes, rulesRes, adjustmentsRes, salaryPaymentsRes, banksRes,
      structuresRes, discountsRes, fineRulesRes, finesRes, vouchersRes, feePaymentsRes,
    ] = await Promise.all([
      list<{ items: Row[] }>(() => campusesService.getAll({ limit: 100 }) as never),
      list<Row[]>(() => academicsService.getClasses() as never),
      list<Row[]>(() => peopleService.getStudents() as never),
      list<Row[]>(() => financeService.getSalaries() as never),
      list<Row[]>(() => financeService.getDeductionRules() as never),
      list<Row[]>(() => financeService.getAdjustments() as never),
      list<Row[]>(() => financeService.getSalaryPayments() as never),
      list<Row[]>(() => financeService.getBankAccounts() as never),
      list<Row[]>(() => financeService.getFeeStructures() as never),
      list<Row[]>(() => financeService.getDiscounts() as never),
      list<Row[]>(() => financeService.getFineRules() as never),
      list<Row[]>(() => financeService.getFines() as never),
      list<Row[]>(() => financeService.getVouchers() as never),
      list<Row[]>(() => financeService.getFeePayments() as never),
    ]);

    // Scope chain for superadmin context: campuses → campus-bound rows; students → vouchers → payments.
    const allCampuses = campusesRes.data?.items ?? [];
    const scopedCampuses = institutionId
      ? allCampuses.filter((c) => c.institutionId === institutionId)
      : allCampuses;
    const campusIds = new Set(scopedCampuses.map((c) => c.id));
    const byCampus = (rows: Row[] | null) =>
      (rows ?? []).filter((r) => !institutionId || campusIds.has(String(r.campusId)));

    const scopedStudents = byCampus(studentsRes.data);
    const studentIds = new Set(scopedStudents.map((s) => s.id));
    const byStudent = (rows: Row[] | null) =>
      (rows ?? []).filter((r) => !institutionId || studentIds.has(String(r.studentId)));

    const scopedVouchers = byStudent(vouchersRes.data);
    const voucherIds = new Set(scopedVouchers.map((v) => v.id));

    setCampuses(scopedCampuses);
    setClasses(classesRes.data ?? []);
    setStudents(scopedStudents);
    setSalaries(byCampus(salariesRes.data));
    setDeductionRules(byCampus(rulesRes.data));
    setAdjustments(byCampus(adjustmentsRes.data));
    setSalaryPayments(byCampus(salaryPaymentsRes.data));
    setBankAccounts(byCampus(banksRes.data));
    setFeeStructures(byCampus(structuresRes.data));
    setDiscounts(byStudent(discountsRes.data));
    setFineRules(byCampus(fineRulesRes.data));
    setFines(byStudent(finesRes.data));
    setVouchers(scopedVouchers);
    setFeePayments(
      (feePaymentsRes.data ?? []).filter((p) => !institutionId || voucherIds.has(String(p.voucherId)))
    );

    try {
      const allUsers = await fetchAllUsers();
      setUsers(institutionId ? allUsers.filter((u) => u.institutionId === institutionId) : allUsers);
    } catch {
      setUsers([]);
    }

    setLoading(false);
  }, [showMessage, institutionId]);

  useEffect(() => {
    load();
  }, [load]);

  const userMap = useMemo(
    () => users.reduce<Record<string, UserLite>>((acc, u) => ((acc[u.id] = u), acc), {}),
    [users]
  );
  const campusMap = useMemo(
    () => campuses.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = String(c.name)), acc), {}),
    [campuses]
  );
  const classMap = useMemo(
    () => classes.reduce<Record<string, string>>((acc, c) => ((acc[c.id] = String(c.name)), acc), {}),
    [classes]
  );
  const studentName = useCallback(
    (studentId?: unknown) => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return "—";
      return userMap[String(student.userId)]?.name ?? String(student.regNo ?? "—");
    },
    [students, userMap]
  );

  const campusOptions: Option[] = campuses.map((c) => ({ value: c.id, label: String(c.name) }));
  const classOptions: Option[] = classes.map((c) => ({ value: c.id, label: String(c.name) }));
  const staffOptions: Option[] = users
    .filter((u) => STAFF_ROLES.includes(u.role))
    .map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }));
  const studentOptions: Option[] = students.map((s) => ({
    value: s.id,
    label: `${userMap[String(s.userId)]?.name ?? "Student"} (${s.regNo ?? "—"})`,
  }));
  const salaryOptions: Option[] = salaries.map((s) => ({
    value: s.id,
    label: `${userMap[String(s.userId)]?.name ?? "Staff"} — ${s.baseSalary}`,
  }));
  const bankOptions: Option[] = bankAccounts.map((b) => ({
    value: b.id,
    label: `${b.bankName} · ${b.accountNumber}`,
  }));
  const structureOptions: Option[] = feeStructures.map((s) => ({
    value: s.id,
    label: `${classMap[String(s.classId)] ?? "Class"} — ${campusMap[String(s.campusId)] ?? "Campus"}`,
  }));
  const voucherOptions: Option[] = vouchers.map((v) => ({
    value: v.id,
    label: `${studentName(v.studentId)} · ${v.month}/${v.year}`,
  }));

  const crud = (
    label: string,
    handlers: {
      create?: (p: Record<string, unknown>) => Promise<unknown>;
      update?: (id: string, p: Record<string, unknown>) => Promise<unknown>;
      remove?: (id: string) => Promise<unknown>;
    }
  ) => (canManage ? {
    ...(handlers.create && {
      onCreate: async (payload: Record<string, unknown>) => {
        const { success } = await apiHandler(() => handlers.create!(payload) as never, { showMessage, successMessage: `${label} created.` });
        if (success) load();
        return success;
      },
    }),
    ...(handlers.update && {
      onUpdate: async (id: string, payload: Record<string, unknown>) => {
        const { success } = await apiHandler(() => handlers.update!(id, payload) as never, { showMessage, successMessage: `${label} updated.` });
        if (success) load();
        return success;
      },
    }),
    ...(handlers.remove && {
      onDelete: async (id: string) => {
        const { success } = await apiHandler(() => handlers.remove!(id) as never, { showMessage, successMessage: `${label} deleted.` });
        if (success) load();
        return success;
      },
    }),
  } : {});

  const userCol = { key: "userId", label: "Staff", render: (r: Row) => userMap[String(r.userId)]?.name ?? "—" };
  const campusCol = { key: "campusId", label: "Campus", render: (r: Row) => campusMap[String(r.campusId)] ?? "—" };
  const studentCol = { key: "studentId", label: "Student", render: (r: Row) => studentName(r.studentId) };
  const monthCol = { key: "month", label: "Month", render: (r: Row) => `${r.month}/${r.year}` };
  const createdCol = { key: "createdAt", label: "Created", render: (r: Row) => formatDate(String(r.createdAt ?? "")) };

  const ruleFields = (kind: "percent" | "amount"): FieldDef[] => [
    { key: "campusId", label: "Campus", type: "select", options: campusOptions, required: true, cols: 6 },
    ...(kind === "percent"
      ? [{ key: "role", label: "Role", type: "select", options: STAFF_ROLES.map((r) => ({ value: r, label: r })), required: true, cols: 6 } as FieldDef]
      : [{ key: "classId", label: "Class (optional)", type: "select", options: classOptions, cols: 6 } as FieldDef]),
    { key: "allowedAbsences", label: "Allowed Absences", type: "number", required: true, cols: 6 },
    { key: kind === "percent" ? "absenceDeductionPercent" : "absenceFineAmount", label: kind === "percent" ? "Absence Deduction %" : "Absence Fine", type: "number", required: true, cols: 6 },
    { key: "allowedLates", label: "Allowed Lates", type: "number", required: true, cols: 6 },
    { key: kind === "percent" ? "lateDeductionPercent" : "lateFineAmount", label: kind === "percent" ? "Late Deduction %" : "Late Fine", type: "number", required: true, cols: 6 },
    { key: "allowedHalfDays", label: "Allowed Half Days", type: "number", required: true, cols: 6 },
    { key: kind === "percent" ? "halfDayDeductionPercent" : "halfDayFineAmount", label: kind === "percent" ? "Half-Day Deduction %" : "Half-Day Fine", type: "number", required: true, cols: 6 },
    { key: "allowedLeaves", label: "Allowed Leaves", type: "number", required: true, cols: 6 },
    { key: kind === "percent" ? "leaveDeductionPercent" : "leaveFineAmount", label: kind === "percent" ? "Leave Deduction %" : "Leave Fine", type: "number", required: true, cols: 6 },
  ];

  const sections = [
    {
      label: "Salaries",
      category: "Payroll",
      description: "Base salary records for staff.",
      icon: <Payments />,
      count: salaries.length,
      node: (
        <ResourceSection
          title="Salaries" singular="Salary" subtitle="Base salary records for staff." rows={salaries} loading={loading}
          columns={[userCol, { key: "role", label: "Role" }, { key: "baseSalary", label: "Base Salary" },
            { key: "effectiveDate", label: "Effective", render: (r) => formatDate(String(r.effectiveDate ?? "")) },
            { key: "status", label: "Status", render: (r) => <Chip label={String(r.status ?? "ACTIVE")} size="small" color={r.status === "TERMINATED" ? "error" : "success"} /> },
            campusCol]}
          fields={[
            { key: "userId", label: "Staff Member", type: "select", options: staffOptions, required: true },
            { key: "campusId", label: "Campus", type: "select", options: campusOptions, required: true, cols: 6 },
            { key: "role", label: "Role", type: "select", options: STAFF_ROLES.map((r) => ({ value: r, label: r })), required: true, cols: 6 },
            { key: "joiningDate", label: "Joining Date", type: "date", required: true, cols: 6 },
            { key: "effectiveDate", label: "Effective Date", type: "date", required: true, cols: 6 },
            { key: "baseSalary", label: "Base Salary", type: "number", required: true, cols: 6 },
            { key: "status", label: "Status", type: "select", options: ["ACTIVE", "UPDATED", "TERMINATED"].map((s) => ({ value: s, label: s })), cols: 6 },
          ]}
          {...crud("Salary", { create: financeService.createSalary, update: financeService.updateSalary, remove: financeService.deleteSalary })}
        />
      ),
    },
    {
      label: "Deduction Rules",
      category: "Payroll",
      description: "Attendance-based salary deductions.",
      icon: <Percent />,
      count: deductionRules.length,
      node: (
        <ResourceSection
          title="Deduction Rules" subtitle="Attendance-based salary deduction rules per campus and role." rows={deductionRules} loading={loading}
          columns={[campusCol, { key: "role", label: "Role" },
            { key: "allowedAbsences", label: "Allowed Absences" }, { key: "absenceDeductionPercent", label: "Absence %" },
            { key: "allowedLates", label: "Allowed Lates" }, { key: "lateDeductionPercent", label: "Late %" }, createdCol]}
          fields={ruleFields("percent")}
          {...crud("Deduction rule", { create: financeService.createDeductionRule, remove: financeService.deleteDeductionRule })}
        />
      ),
    },
    {
      label: "Adjustments",
      category: "Payroll",
      description: "One-off bonuses and deductions.",
      icon: <SwapVert />,
      count: adjustments.length,
      node: (
        <ResourceSection
          title="Salary Adjustments" subtitle="One-off bonuses and deductions." rows={adjustments} loading={loading}
          columns={[userCol,
            { key: "adjustmentType", label: "Type", render: (r) => <Chip label={String(r.adjustmentType)} size="small" color={r.adjustmentType === "BONUS" ? "success" : "warning"} /> },
            { key: "amount", label: "Amount" }, { key: "remarks", label: "Remarks" }, campusCol, createdCol]}
          fields={[
            { key: "userId", label: "Staff Member", type: "select", options: staffOptions, required: true },
            { key: "salaryId", label: "Salary Record", type: "select", options: salaryOptions, required: true },
            { key: "campusId", label: "Campus", type: "select", options: campusOptions, required: true, cols: 6 },
            { key: "adjustmentType", label: "Type", type: "select", options: [{ value: "BONUS", label: "Bonus" }, { value: "DEDUCTION", label: "Deduction" }], required: true, cols: 6 },
            { key: "amount", label: "Amount", type: "number", required: true, cols: 6 },
            { key: "remarks", label: "Remarks", cols: 6 },
          ]}
          {...crud("Adjustment", { create: financeService.createAdjustment, remove: financeService.deleteAdjustment })}
        />
      ),
    },
    {
      label: "Salary Payments",
      category: "Payroll",
      description: "Monthly salary disbursements.",
      icon: <Paid />,
      count: salaryPayments.length,
      node: (
        <ResourceSection
          title="Salary Payments" subtitle="Monthly salary disbursements." rows={salaryPayments} loading={loading}
          columns={[userCol, monthCol,
            { key: "netAmount", label: "Net Amount", render: (r) => String(r.netAmount ?? r.amount ?? "—") },
            campusCol, createdCol]}
          fields={[
            { key: "userId", label: "Staff Member", type: "select", options: staffOptions, required: true },
            { key: "salaryId", label: "Salary Record", type: "select", options: salaryOptions, required: true },
            { key: "campusId", label: "Campus", type: "select", options: campusOptions, required: true },
            { key: "month", label: "Month", type: "select", options: MONTH_OPTIONS, required: true, cols: 6 },
            { key: "year", label: "Year", type: "number", required: true, cols: 6 },
          ]}
          {...crud("Salary payment", { create: financeService.createSalaryPayment, remove: financeService.deleteSalaryPayment })}
        />
      ),
    },
    {
      label: "Bank Accounts",
      category: "Banking",
      description: "Accounts that receive fee payments.",
      icon: <AccountBalanceWallet />,
      count: bankAccounts.length,
      node: (
        <ResourceSection
          title="Bank Accounts" subtitle="Accounts that receive fee payments." rows={bankAccounts} loading={loading}
          columns={[{ key: "bankName", label: "Bank" }, { key: "accountTitle", label: "Title" },
            { key: "accountNumber", label: "Account #" }, { key: "iban", label: "IBAN" }, campusCol, createdCol]}
          fields={[
            { key: "campusId", label: "Campus", type: "select", options: campusOptions, required: true },
            { key: "bankName", label: "Bank Name", required: true, cols: 6 },
            { key: "accountTitle", label: "Account Title", required: true, cols: 6 },
            { key: "accountNumber", label: "Account Number", required: true, cols: 6 },
            { key: "iban", label: "IBAN", cols: 6 },
            { key: "branchCode", label: "Branch Code", cols: 6 },
          ]}
          {...crud("Bank account", { create: financeService.createBankAccount, update: financeService.updateBankAccount, remove: financeService.deleteBankAccount })}
        />
      ),
    },
    {
      label: "Fee Structures",
      category: "Student Fees",
      description: "Per-class fee breakdowns.",
      icon: <RequestQuote />,
      count: feeStructures.length,
      node: (
        <ResourceSection
          title="Fee Structures" subtitle="Per-class fee breakdowns used to generate vouchers." rows={feeStructures} loading={loading}
          columns={[
            { key: "classId", label: "Class", render: (r) => classMap[String(r.classId)] ?? "—" },
            campusCol,
            { key: "feeBreakdown", label: "Breakdown", render: (r) => {
                const breakdown = r.feeBreakdown as Record<string, number> | undefined;
                if (!breakdown) return "—";
                const total = Object.values(breakdown).reduce((a, b) => a + Number(b || 0), 0);
                return `${Object.keys(breakdown).length} item(s) · ${total}`;
              } },
            createdCol]}
          fields={[
            { key: "classId", label: "Class", type: "select", options: classOptions, required: true, cols: 6 },
            { key: "campusId", label: "Campus", type: "select", options: campusOptions, required: true, cols: 6 },
            { key: "feeBreakdown", label: "Fee Breakdown (JSON)", type: "json", required: true, helperText: 'e.g. {"tuition": 5000, "transport": 1500}' },
          ]}
          {...crud("Fee structure", { create: financeService.createFeeStructure, update: financeService.updateFeeStructure, remove: financeService.deleteFeeStructure })}
        />
      ),
    },
    {
      label: "Discounts",
      category: "Student Fees",
      description: "Sibling, merit and need-based discounts.",
      icon: <Discount />,
      count: discounts.length,
      node: (
        <ResourceSection
          title="Student Discounts" subtitle="Sibling, merit, need-based and staff-child discounts." rows={discounts} loading={loading}
          columns={[studentCol,
            { key: "discountType", label: "Type", render: (r) => <Chip label={String(r.discountType)} size="small" /> },
            { key: "discountAmount", label: "Amount" }, { key: "remarks", label: "Remarks" }, createdCol]}
          fields={[
            { key: "studentId", label: "Student", type: "select", options: studentOptions, required: true },
            { key: "discountType", label: "Type", type: "select", options: ["SIBLING", "MERIT", "NEED_BASED", "STAFF_CHILD"].map((d) => ({ value: d, label: d })), required: true, cols: 6 },
            { key: "discountAmount", label: "Amount", type: "number", required: true, cols: 6 },
            { key: "remarks", label: "Remarks" },
          ]}
          {...crud("Discount", { create: financeService.createDiscount, remove: financeService.deleteDiscount })}
        />
      ),
    },
    {
      label: "Fine Rules",
      category: "Fines",
      description: "Attendance-based fine rules.",
      icon: <Gavel />,
      count: fineRules.length,
      node: (
        <ResourceSection
          title="Student Fine Rules" subtitle="Attendance-based fine rules per campus." rows={fineRules} loading={loading}
          columns={[campusCol,
            { key: "classId", label: "Class", render: (r) => (r.classId ? classMap[String(r.classId)] ?? "—" : "All") },
            { key: "allowedAbsences", label: "Allowed Absences" }, { key: "absenceFineAmount", label: "Absence Fine" },
            { key: "allowedLates", label: "Allowed Lates" }, { key: "lateFineAmount", label: "Late Fine" }, createdCol]}
          fields={ruleFields("amount")}
          {...crud("Fine rule", { create: financeService.createFineRule, remove: financeService.deleteFineRule })}
        />
      ),
    },
    {
      label: "Fines",
      category: "Fines",
      description: "Monthly fines applied to students.",
      icon: <MoneyOff />,
      count: fines.length,
      node: (
        <ResourceSection
          title="Student Fines" subtitle="Monthly fines applied to students." rows={fines} loading={loading}
          columns={[studentCol, monthCol, { key: "totalFineAmount", label: "Amount" },
            { key: "fineReason", label: "Reason" },
            { key: "status", label: "Status", render: (r) => <Chip label={String(r.status ?? "PENDING")} size="small" color={r.status === "PAID" ? "success" : "warning"} /> },
            campusCol]}
          fields={[
            { key: "studentId", label: "Student", type: "select", options: studentOptions, required: true },
            { key: "campusId", label: "Campus", type: "select", options: campusOptions, required: true },
            { key: "month", label: "Month", type: "select", options: MONTH_OPTIONS, required: true, cols: 6 },
            { key: "year", label: "Year", type: "number", required: true, cols: 6 },
            { key: "totalFineAmount", label: "Fine Amount", type: "number", required: true, cols: 6 },
            { key: "fineReason", label: "Reason", cols: 6 },
          ]}
          {...crud("Fine", { create: financeService.createFine, remove: financeService.deleteFine })}
        />
      ),
    },
    {
      label: "Fee Vouchers",
      category: "Student Fees",
      description: "Monthly vouchers issued to students.",
      icon: <ReceiptLong />,
      count: vouchers.length,
      node: (
        <ResourceSection
          title="Fee Vouchers" subtitle="Monthly fee vouchers issued to students." rows={vouchers} loading={loading}
          columns={[studentCol, monthCol,
            { key: "totalAmount", label: "Total", render: (r) => String(r.totalAmount ?? r.amount ?? "—") },
            { key: "dueDate", label: "Due", render: (r) => formatDate(String(r.dueDate ?? "")) },
            { key: "status", label: "Status", render: (r) => (r.status ? <Chip label={String(r.status)} size="small" color={r.status === "PAID" ? "success" : "warning"} /> : "—") }]}
          fields={[
            { key: "studentId", label: "Student", type: "select", options: studentOptions, required: true },
            { key: "feeStructureId", label: "Fee Structure", type: "select", options: structureOptions, required: true },
            { key: "month", label: "Month", type: "select", options: MONTH_OPTIONS, required: true, cols: 6 },
            { key: "year", label: "Year", type: "number", required: true, cols: 6 },
            { key: "dueDate", label: "Due Date", type: "date", required: true, cols: 6 },
            { key: "lateFeeFine", label: "Late Fee Fine", type: "number", cols: 6 },
            { key: "bankId", label: "Bank Account", type: "select", options: bankOptions },
          ]}
          {...crud("Fee voucher", { create: financeService.createVoucher, update: financeService.updateVoucher, remove: financeService.deleteVoucher })}
        />
      ),
    },
    {
      label: "Fee Payments",
      category: "Student Fees",
      description: "Payments recorded against vouchers.",
      icon: <PointOfSale />,
      count: feePayments.length,
      node: (
        <ResourceSection
          title="Fee Payments" subtitle="Payments recorded against fee vouchers." rows={feePayments} loading={loading}
          columns={[
            { key: "voucherId", label: "Voucher", render: (r) => {
                const voucher = vouchers.find((v) => v.id === r.voucherId);
                return voucher ? `${studentName(voucher.studentId)} · ${voucher.month}/${voucher.year}` : "—";
              } },
            monthCol, { key: "paidAmount", label: "Paid" },
            { key: "paymentMethod", label: "Method", render: (r) => <Chip label={String(r.paymentMethod)} size="small" /> },
            { key: "paymentDate", label: "Date", render: (r) => formatDate(String(r.paymentDate ?? "")) }]}
          fields={[
            { key: "voucherId", label: "Fee Voucher", type: "select", options: voucherOptions, required: true },
            { key: "month", label: "Month", type: "select", options: MONTH_OPTIONS, required: true, cols: 6 },
            { key: "year", label: "Year", type: "number", required: true, cols: 6 },
            { key: "paidAmount", label: "Paid Amount", type: "number", required: true, cols: 6 },
            { key: "paymentMethod", label: "Method", type: "select", options: [{ value: "CASH", label: "Cash" }, { value: "BANK_TRANSFER", label: "Bank Transfer" }], required: true, cols: 6 },
            { key: "paymentDate", label: "Payment Date", type: "date", required: true },
          ]}
          {...crud("Fee payment", { create: financeService.createFeePayment, remove: financeService.deleteFeePayment })}
        />
      ),
    },
  ];

  if (!loading && campuses.length === 0) {
    return (
      <CampusRequiredNotice
        moduleLabel="finance"
        ctaHref={institutionId ? undefined : "/dashboard/campuses"}
      />
    );
  }

  const activeSection = sections.find((s) => s.label === activeKey) ?? null;

  if (activeSection) {
    return (
      <>
        <Button
          startIcon={<ArrowBack />}
          color="inherit"
          onClick={() => setActiveKey(null)}
          sx={{ mb: 2, color: "text.secondary" }}
        >
          All Finance
        </Button>
        {activeSection.node}
      </>
    );
  }

  const categories = ["Payroll", "Student Fees", "Fines", "Banking"];

  return (
    <>
      {categories.map((category) => {
        const items = sections.filter((s) => s.category === category);
        if (items.length === 0) return null;
        return (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, mb: 1.5 }}
            >
              {category}
            </Typography>
            <Grid container spacing={2}>
              {items.map((section) => (
                <Grid key={section.label} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      height: "100%",
                      transition: "box-shadow 0.15s, transform 0.15s",
                      "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
                    }}
                  >
                    <CardActionArea onClick={() => setActiveKey(section.label)} sx={{ height: "100%", alignItems: "stretch" }}>
                      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              backgroundColor: "action.hover",
                              color: "primary.main",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {section.icon}
                          </Box>
                          {loading ? (
                            <Skeleton width={32} height={24} />
                          ) : (
                            <Chip
                              label={section.count}
                              size="small"
                              color={section.count > 0 ? "primary" : "default"}
                              variant={section.count > 0 ? "filled" : "outlined"}
                            />
                          )}
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>{section.label}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                          {section.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      })}
    </>
  );
}
