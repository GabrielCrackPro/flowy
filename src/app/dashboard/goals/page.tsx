"use client";

import { BackHeader } from "@components/dashboard";
import {
  ConfirmDialog,
  EmptyState,
  EntityAudit,
  EntityListView,
  ErrorBoundary,
  GradientButton,
  Icon,
  PageTransition,
  QuickActionDialog,
  type ViewMode,
} from "@components/shared";
import { Button } from "@components/ui";
import { useGoalApi } from "@hooks/api/useGoalApi";
import { useProfile } from "@hooks/useProfile";
import { cn, formatCurrency } from "@lib/utils";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GoalFormSheet } from "@/components/goals";
import { useEntityFormModal } from "@/hooks";
import {
  CheckCircle2,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from "@/lib/icons";
import type { CreateGoalInput, Goal, UpdateGoalInput } from "@/types/Goal";

export default function GoalsPage() {
  const { t } = useTranslation();
  const { profile } = useProfile();

  const { goals, loading, create, update, remove, isCreating, isUpdating } =
    useGoalApi();

  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [quickAddGoal, setQuickAddGoal] = useState<Goal | null>(null);

  const handleQuickAdd = async (amount: number) => {
    if (!quickAddGoal) return;

    // Validate amount before proceeding
    if (amount <= 0 || Number.isNaN(amount)) {
      console.error("Invalid amount for quick add:", amount);
      return;
    }

    try {
      const newSavedAmount = quickAddGoal.savedAmount + amount;

      // If the new amount reaches or exceeds the target, cap it at target
      if (newSavedAmount >= quickAddGoal.targetAmount) {
        await update(quickAddGoal.id, {
          savedAmount: quickAddGoal.targetAmount,
        });
      } else {
        await update(quickAddGoal.id, {
          savedAmount: newSavedAmount,
        });
      }
      setQuickAddGoal(null);
    } catch (error) {
      console.error("Failed to add savings:", error);
    }
  };

  const {
    formOpen,
    closeForm,
    editing,
    deleting,
    setDeleting,
    openCreate,
    openEdit,
    handleSubmit,
    handleDelete,
    isSubmitting,
  } = useEntityFormModal<Goal, CreateGoalInput, UpdateGoalInput>({
    create,
    update,
    remove,
    isCreating,
    isUpdating,
  });

  const locale = profile?.locale ?? "es-ES";
  const currency = profile?.currency ?? "USD";

  const visible = useMemo(() => {
    if (!searchQuery.trim()) return goals;

    const query = searchQuery.toLowerCase();
    return goals.filter((goal) => goal.title.toLowerCase().includes(query));
  }, [goals, searchQuery]);

  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  const completedGoals = goals.filter(
    (goal) => goal.savedAmount >= goal.targetAmount,
  ).length;
  const _overallProgress =
    totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <PageTransition>
      <ErrorBoundary>
        <div className="space-y-6">
          <BackHeader
            title={t("nav.goals")}
            href="/dashboard"
            actions={
              <GradientButton onClick={openCreate} fullWidth={false}>
                <span className="hidden sm:inline">{t("goals.new")}</span>
              </GradientButton>
            }
          />

          <p className="text-sm text-muted-foreground">
            {t("goals.description")}
          </p>

          {goals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="grid gap-4 sm:grid-cols-3"
            >
              <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                    <Icon icon={Target} className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("goals.totalTarget")}
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(totalTarget, locale, currency)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                    <Icon icon={TrendingUp} className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("goals.totalSaved")}
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(totalSaved, locale, currency)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                    <Icon icon={CheckCircle2} className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("goals.completed")}
                    </p>
                    <p className="text-lg font-semibold">
                      {completedGoals} / {goals.length}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <EntityListView
            data={visible}
            columns={[]}
            loading={loading}
            keyExtractor={(goal) => goal.id}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchPlaceholder={t("goals.searchPlaceholder")}
            view={view}
            onViewChange={setView}
            skeletonVariant="detail"
            emptyState={
              <EmptyState
                icon={<Icon icon={Target} size="lg" />}
                title={t("goals.noGoals")}
                description={t("goals.noGoalsDescription")}
                action={
                  <GradientButton onClick={openCreate} size="sm">
                    {t("goals.createFirst")}
                  </GradientButton>
                }
              />
            }
            renderCard={(goal, index) => {
              const pct =
                goal.targetAmount > 0
                  ? Math.min(
                      100,
                      Math.round((goal.savedAmount / goal.targetAmount) * 100),
                    )
                  : 0;
              const isCompleted = pct >= 100;
              const isNearCompletion = pct >= 80 && !isCompleted;
              const _remaining = Math.max(
                0,
                goal.targetAmount - goal.savedAmount,
              );

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group"
                >
                  <div
                    className={cn(
                      "relative rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition hover:shadow-lg hover:-translate-y-0.5",
                      isCompleted
                        ? "border-emerald-500/30 from-emerald-500/5 to-emerald-500/0"
                        : isNearCompletion
                          ? "border-amber-500/30 from-amber-500/5 to-amber-500/0"
                          : "border-border/40 from-card to-card/50",
                    )}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-10 items-center justify-center rounded-xl",
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                              : isNearCompletion
                                ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                                : "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
                          )}
                        >
                          <Icon icon={Target} className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground">
                            {goal.title}
                          </h3>
                          {goal.deadline && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(goal.deadline).toLocaleDateString(
                                locale,
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : isNearCompletion
                              ? "bg-amber-500 text-white"
                              : "bg-blue-500 text-white",
                        )}
                      >
                        {pct}%
                      </div>
                    </div>

                    <div className="mb-4 space-y-2.5">
                      <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          className={cn(
                            "h-full rounded-full",
                            isCompleted
                              ? "bg-emerald-500"
                              : isNearCompletion
                                ? "bg-amber-500"
                                : "bg-blue-500",
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Icon
                            icon={TrendingUp}
                            className="size-3.5 text-emerald-500"
                          />
                          <span className="text-xs font-medium">
                            {t("goals.savedAmount")}
                          </span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-emerald-600">
                          {formatCurrency(goal.savedAmount, locale, currency)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Icon icon={Target} className="size-3.5" />
                          <span className="text-xs font-medium">
                            {t("goals.targetAmount")}
                          </span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(goal.targetAmount, locale, currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-3">
                      <div className="min-w-0">
                        <EntityAudit
                          createdAt={goal.createdAt}
                          createdBy={goal.user}
                          updatedAt={goal.updatedAt}
                          updatedBy={goal.updatedByProfile}
                          className="mb-1.5"
                        />
                        <div className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
                          <span className="font-medium">
                            {formatCurrency(goal.savedAmount, locale, currency)}
                          </span>
                          <span className="text-muted-foreground/40">/</span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(
                              goal.targetAmount,
                              locale,
                              currency,
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {isCompleted ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setQuickAddGoal(goal)}
                            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                            title={t("goals.addMore")}
                          >
                            <Icon icon={Plus} className="size-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setQuickAddGoal(goal)}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                          >
                            <Icon icon={Plus} className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(goal)}
                        >
                          <Icon icon={Pencil} className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleting(goal)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Icon icon={Trash2} className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }}
          />

          {deleting && (
            <ConfirmDialog
              open={!!deleting}
              onOpenChange={(open) => !open && setDeleting(null)}
              title={t("goals.deleteConfirmTitle")}
              description={t("goals.deleteConfirmDescription", {
                title: deleting.title,
              })}
              onConfirm={() => handleDelete()}
            />
          )}

          {formOpen && (
            <GoalFormSheet
              open={formOpen}
              onOpenChange={closeForm}
              editing={editing}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          {quickAddGoal && (
            <QuickActionDialog
              open={!!quickAddGoal}
              onOpenChange={(open) => !open && setQuickAddGoal(null)}
              title={
                quickAddGoal.savedAmount >= quickAddGoal.targetAmount
                  ? t("goals.addMore")
                  : t("goals.quickAddTitle")
              }
              description={quickAddGoal.title}
              icon={Target}
              iconColor={
                quickAddGoal.savedAmount >= quickAddGoal.targetAmount
                  ? "text-emerald-600"
                  : "text-amber-600"
              }
              iconBgColor={
                quickAddGoal.savedAmount >= quickAddGoal.targetAmount
                  ? "from-emerald-500/20 to-emerald-500/10"
                  : "from-amber-500/20 to-amber-500/10"
              }
              buttonColor={
                quickAddGoal.savedAmount >= quickAddGoal.targetAmount
                  ? "from-emerald-500 to-emerald-600"
                  : "from-amber-500 to-amber-600"
              }
              actionLabel={t("goals.quickAdd")}
              actionType="add"
              currentAmount={quickAddGoal.savedAmount}
              targetAmount={quickAddGoal.targetAmount}
              onAction={handleQuickAdd}
              isSubmitting={isUpdating}
              showProgress={true}
              progressLabelSuffix={t("dashboard.remaining")}
            />
          )}
        </div>
      </ErrorBoundary>
    </PageTransition>
  );
}
