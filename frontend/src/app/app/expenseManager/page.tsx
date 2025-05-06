"use client";
import type { Expense, ExpenseFormData } from "@/types/global";
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/user";
import { BaseModal as Modal } from "@/components/modals/modal";

const categories = [
  "Housing",
  "Transportation",
  "Food",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Education",
  "Travel",
  "Other",
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(cents: number) {
  return currencyFormatter.format(cents / 100);
}

function ExpenseManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { data: user } = useUser();

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "READ", userId: user.id }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error("Expense fetch error:", err);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user, fetchExpenses]);

  const handleSubmit = useCallback(
    async (expenseData: Expense) => {
      if (!user) return;
      try {
        const method = editingExpense ? "UPDATE" : "CREATE";
        const response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method,
            ...expenseData,
            id: editingExpense?.id,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to save expense");
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setShowModal(false);
        setEditingExpense(null);
        fetchExpenses();
      } catch (err) {
        console.error("Expense save error:", err);
        setError("Failed to save expense");
      }
    },
    [editingExpense, fetchExpenses, user]
  );

  const handleDelete = useCallback(
    async (expenseId: string) => {
      if (!user) return;
      if (!confirm("Are you sure you want to delete this expense?")) return;
      try {
        const response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "DELETE",
            userId: user.id,
            id: expenseId,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to delete expense");
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        fetchExpenses();
      } catch (err) {
        console.error("Expense deletion error:", err);
        setError("Failed to delete expense");
      }
    },
    [fetchExpenses, user]
  );

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingExpense(null);
  }, []);

  const handleEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  }, []);

  interface ExpenseModalProps {
    onClose: () => void;
    onSubmit: (expense: Expense) => void;
    initialData: Expense | null;
  }

  const ExpenseModal = ({ onClose, onSubmit, initialData }: ExpenseModalProps) => {
    const [formData, setFormData] = useState<ExpenseFormData>(
      initialData
        ? {
            category: initialData.category,
            amount: (initialData.amount / 100).toString(),
            date: initialData.date,
            description: initialData.description,
            recurrence: initialData.recurrence ?? "one-time",
            frequency: initialData.frequency,
          }
        : {
            category: "",
            amount: "",
            date: new Date().toISOString().split("T")[0],
            description: "",
            recurrence: "one-time",
            frequency: undefined,
          }
    );

    const { data: user } = useUser();

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      onSubmit({
        ...formData,
        amount: parseFloat(formData.amount) * 100,
        userId: user?.id ?? "",
        date: formData.date,
        description: formData.description,
        category: formData.category,
        recurrence: formData.recurrence ?? "one-time",
        frequency: formData.recurrence === "recurring" ? formData.frequency : undefined,
      });
    };

    return (
      <div className="bg-[#2a2a2a] rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white/80">
            {initialData ? "Edit Expense" : "Add New Expense"}
          </h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/80 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              required
            />
          </div>

          <div>
            <label className="inline-flex items-center text-white/60 space-x-2">
              <input
                type="checkbox"
                checked={formData.recurrence === "recurring"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recurrence: e.target.checked ? "recurring" : "one-time",
                    frequency: e.target.checked ? formData.frequency ?? "Monthly" : undefined,
                  })
                }
                className="form-checkbox h-4 w-4 text-green-500"
              />
              <span>Recurring Expense</span>
            </label>
          </div>

          {formData.recurrence === "recurring" && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-white/60 mb-1">
                Recurrence Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as ExpenseFormData["frequency"] })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              >
                {["Daily", "Weekly", "Biweekly", "Monthly", "Quarterly", "Yearly"].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full p-3 bg-green-500 text-black rounded-xl font-medium hover:bg-green-400 shadow-[0_0_8px_#00ff88] hover:shadow-[0_0_12px_#00ff88] transition-all duration-200"
          >
            {initialData ? "Update Expense" : "Add Expense"}
          </button>
        </form>
      </div>
    );
  };


  return (
    <div>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex justify-end mb-6">
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-green-500 text-black rounded-xl font-medium hover:bg-green-400 shadow-[0_0_8px_#00ff88] hover:shadow-[0_0_12px_#00ff88] transition-all duration-200"
          >
            <i className="fas fa-plus mr-2"></i>
            Add Expense
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
            <p className="text-red-400 flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </div>
        )}

        <div className="grid gap-6">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full shadow-[0_0_8px_#00ff88]"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white/40 text-6xl mb-4">
                <i className="fas fa-receipt"></i>
              </div>
              <h3 className="text-xl font-medium text-white/80 mb-2">
                No Expenses Yet
              </h3>
              <p className="text-white/60">
                Start tracking your expenses by adding your first expense.
              </p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-[#2a2a2a] rounded-xl p-6 border border-white/10 hover:border-green-500/50 transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-white/80">
                      {expense.description}
                    </h3>
                    <p className="text-white/60">
                      <i className="fas fa-tag mr-2"></i>
                      {expense.category}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 text-white/60 hover:text-white/80 transition-colors"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => expense.id && handleDelete(expense.id)}
                      className="p-2 text-white/60 hover:text-red-400 transition-colors"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-red-400 font-semibold text-xl">
                    {formatCurrency(expense.amount)}
                  </span>
                  <span className="text-white/60">
                    {new Date(expense.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {(showModal || editingExpense) && (
        <Modal isOpen={true} onClose={handleCloseModal}>
          <ExpenseModal
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            initialData={editingExpense}
          />
        </Modal>
      )}
    </div>
  );
}

export default ExpenseManager;