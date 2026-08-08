"use client";

import { useTranslation } from "react-i18next";
import { UserAvatar } from "@/components/shared";
import { DetailCard, DetailRow } from "@/components/shared/detail-card";
import { FileUpload } from "@/components/shared/file-upload";
import { Icon } from "@/components/shared/icon";
import { Clock, ExternalLink, User } from "@/lib/icons";
import type { Transaction } from "@/types/Transaction";

function formatDateTime(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateStr));
}

export function ReceiptCard({
  transaction,
  onReceiptChange,
}: {
  transaction: Transaction;
  onReceiptChange: (url: string | null) => void;
}) {
  const { t } = useTranslation();

  return (
    <DetailCard
      delay={0.1}
      className="p-6 border border-border/30 bg-linear-to-br from-card to-card/50 shadow-md"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary dark:from-primary/30 dark:to-primary/20 dark:text-primary-foreground">
          <Icon icon={ExternalLink} className="size-3.5" />
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40">
          {t("transaction.receipt")}
        </span>
      </div>

      <FileUpload
        value={transaction.receiptUrl}
        onChange={(url) => onReceiptChange(url)}
        labels={{
          uploadLabel: t("transaction.uploadReceipt"),
          dragHint: t("transaction.dragDropHint"),
          fileTypesHint: t("transaction.fileTypesHint"),
          changeLabel: t("transaction.changeFile"),
          removeLabel: t("transaction.removeFile"),
          uploadingLabel: t("transaction.uploadProgress"),
          errorLabel: t("transaction.uploadError"),
          retryLabel: t("transaction.retry"),
        }}
      />
    </DetailCard>
  );
}

export function NotesCard({ notes }: { notes: string | null }) {
  const { t } = useTranslation();

  return (
    <DetailCard
      delay={0.1}
      className="p-6 border border-border/30 bg-linear-to-br from-card to-card/50 shadow-md"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/40 mb-3">
        {t("transaction.notes")}
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground/80">
        {notes ?? <span className="text-muted-foreground/30">—</span>}
      </p>
    </DetailCard>
  );
}

export function AuditCard({
  transaction,
  locale,
}: {
  transaction: Transaction;
  locale: string;
}) {
  const { t } = useTranslation();

  return (
    <DetailCard
      delay={0.15}
      className="divide-y divide-border/30 border border-border/30 bg-linear-to-br from-card to-card/50 shadow-md"
    >
      <DetailRow
        icon={<Icon icon={User} className="size-4" />}
        label={t("transaction.createdBy")}
        value={
          <div className="flex items-center gap-2">
            {transaction.user && (
              <>
                <UserAvatar profile={transaction.user} className="size-5" />
                <span className="text-sm font-medium">
                  {transaction.user.name}
                </span>
              </>
            )}
            {transaction.createdAt && (
              <span className="text-xs text-muted-foreground/50">
                {formatDateTime(transaction.createdAt, locale)}
              </span>
            )}
          </div>
        }
      />
      {transaction.updatedByProfile && (
        <DetailRow
          icon={<Icon icon={Clock} className="size-4" />}
          label={t("transaction.updatedBy")}
          value={
            <div className="flex items-center gap-2">
              <UserAvatar
                profile={transaction.updatedByProfile}
                className="size-5"
              />
              <span className="text-sm font-medium">
                {transaction.updatedByProfile.name}
              </span>
              {transaction.updatedAt && (
                <span className="text-xs text-muted-foreground/50">
                  {formatDateTime(transaction.updatedAt, locale)}
                </span>
              )}
            </div>
          }
        />
      )}
    </DetailCard>
  );
}
