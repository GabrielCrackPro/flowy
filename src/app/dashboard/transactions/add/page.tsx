"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  getDefaultTransactionValues,
  TransactionForm,
} from "@/components/shared";
import { useTransactionApi } from "@/hooks/api";
import type { CreateTransactionSchema } from "@/lib/schemas";

export default function NewTransactionPage() {
  const router = useRouter();
  const { create } = useTransactionApi(undefined, { enabled: false });

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
        initialValues={getDefaultTransactionValues()}
        onSubmit={handleSubmit}
      />
    </motion.div>
  );
}
