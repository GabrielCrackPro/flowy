"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { TransactionForm } from "@/components/shared";
import { useTransactionApi } from "@/hooks/api";
import type { CreateTransactionSchema } from "@/lib/schemas";

export default function NewTransactionPage() {
  const router = useRouter();
  const { create } = useTransactionApi();

  const handleSubmit = async (values: CreateTransactionSchema) => {
    await create(values);
    router.back();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <TransactionForm
        mode="create"
        initialValues={{ type: "EXPENSE", amount: 0, date: new Date() }}
        onSubmit={handleSubmit}
      />
    </motion.div>
  );
}
