
"use client";

import React, { useState } from "react";

interface TaxSectionProps {
  loading?: boolean;
  onSubmit?: (data: {
    taxResidency: string;
    salary: number;
    dividends: number;
    taxCode: string;
    pensionContribution: number;
    studentLoanStatus: string;
  }) => void;
}

export default function TaxSection({
  loading = false,
  onSubmit,
}: TaxSectionProps) {
  const [taxResidency, setTaxResidency] = useState("GB");
  const [salary, setSalary] = useState(0);
  const [dividends, setDividends] = useState(0);
  const [taxCode, setTaxCode] = useState("");
  const [pensionContribution, setPensionContribution] = useState(0);
  const [studentLoanStatus, setStudentLoanStatus] = useState("none");

  const allowanceText =
    taxResidency === "GB"
      ? "UK Tax-Free Allowance: £12,570"
      : taxResidency === "US"
      ? "US Federal Deduction: $13,850 (single filer)"
      : null;

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        taxResidency,
        salary,
        dividends,
        taxCode,
        pensionContribution,
        studentLoanStatus,
      });
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">Taxes & Income</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Tax Residency Country</label>
          <select
            value={taxResidency}
            onChange={(e) => setTaxResidency(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Tax Code</label>
          <input
            type="text"
            value={taxCode}
            onChange={(e) => setTaxCode(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Annual Salary</label>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Annual Dividends</label>
          <input
            type="number"
            value={dividends}
            onChange={(e) => setDividends(Number(e.target.value))}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Pension Contribution (£/yr)</label>
          <input
            type="number"
            value={pensionContribution}
            onChange={(e) => setPensionContribution(Number(e.target.value))}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Student Loan Status</label>
          <select
            value={studentLoanStatus}
            onChange={(e) => setStudentLoanStatus(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            <option value="none">None</option>
            <option value="plan1">Plan 1</option>
            <option value="plan2">Plan 2</option>
            <option value="plan4">Plan 4 (Scotland)</option>
            <option value="postgrad">Postgraduate</option>
          </select>
        </div>
      </div>

      {allowanceText && (
        <p className="text-sm text-white/60">{allowanceText}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 mt-2 rounded-md bg-green-500 text-black font-medium hover:bg-green-400 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Tax Details"}
      </button>
    </section>
  );
}