"use client";

import { useTranslation } from "react-i18next";
import { PaymentMethodIcon, TagBadge } from "@/components/shared";
import { DetailCard, DetailRow } from "@/components/shared/detail-card";
import { Icon } from "@/components/shared/icon";
import { Calendar, Repeat2, Tag } from "@/lib/icons";
import type { Transaction } from "@/types/Transaction";
import { PAYMENT_METHOD_KEY } from "@/utils/constants";

export function TransactionInfoCard({
  transaction,
  dateTimeStr,
}: {
  transaction: Transaction;
  dateTimeStr: string | null;
}) {
  const { t } = useTranslation();

  return (
    <DetailCard
      delay={0.05}
      className="divide-y divide-border/30 border border-border/30 bg-linear-to-br from-card to-card/50 shadow-md"
    >
      <DetailRow
        icon={<Icon icon={Calendar} className="size-4" />}
        label={t("transaction.dateTime")}
        value={dateTimeStr}
      />
      <DetailRow
        icon={<Icon icon={Repeat2} className="size-4" />}
        label={t("transaction.recurring")}
        value={
          transaction.isRecurring ? (
            t("common.yes")
          ) : (
            <span className="text-muted-foreground/50">{t("common.no")}</span>
          )
        }
      />
      <DetailRow
        icon={<Icon icon={Tag} className="size-4" />}
        label={t("transaction.category")}
        value={
          transaction.tags && transaction.tags.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-1">
              {transaction.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground/30">—</span>
          )
        }
      />
      <DetailRow
        icon={
          <PaymentMethodIcon
            method={transaction.paymentMethod}
            className="size-4"
          />
        }
        label={t("transaction.paymentMethod")}
        value={
          transaction.paymentMethod ? (
            <div className="flex items-center gap-2">
              <PaymentMethodIcon
                method={transaction.paymentMethod}
                className="size-4"
              />
              <span>
                {t(
                  PAYMENT_METHOD_KEY[transaction.paymentMethod] ??
                    transaction.paymentMethod,
                )}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground/30">—</span>
          )
        }
      />
    </DetailCard>
  );
}
