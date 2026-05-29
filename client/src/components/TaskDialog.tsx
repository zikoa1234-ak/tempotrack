import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTaskSchema, type Task } from "@shared/schema";
import { useCreateTask, useUpdateTask } from "@/lib/tasks";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { calculateDuration } from "@/lib/tasks";

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultPeriod = "day",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultPeriod?: "day" | "month" | "year";
}) {
  const { t } = useI18n();
  const isEdit = !!task;
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      notes: "",
      period: defaultPeriod,
      status: "todo",
      progress: 0,
      priority: "medium",
      category: "Work",
      dueDate: "",
      startDate: "",
      endDate: "",
      timeEstimate: undefined,
      metricTarget: undefined,
      metricUnit: "",
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        notes: task.notes ?? "",
        period: task.period as any,
        status: task.status as any,
        progress: task.progress,
        priority: task.priority as any,
        category: task.category,
        dueDate: task.dueDate ?? "",
        startDate: task.startDate ?? "",
        endDate: task.endDate ?? "",
        timeEstimate: task.timeEstimate ?? undefined,
        metricTarget: task.metricTarget ?? undefined,
        metricUnit: task.metricUnit ?? "",
      });
    } else {
      form.reset({
        title: "",
        notes: "",
        period: defaultPeriod,
        status: "todo",
        progress: 0,
        priority: "medium",
        category: "Work",
        dueDate: "",
        startDate: "",
        endDate: "",
        timeEstimate: undefined,
        metricTarget: undefined,
        metricUnit: "",
      });
    }
  }, [task, open, defaultPeriod, form]);

  const durationDisplay = calculateDuration(
    form.watch("startDate"),
    form.watch("endDate")
  );

  async function onSubmit(values: any) {
    const payload = {
      ...values,
      notes: values.notes?.trim() || null,
      dueDate: values.dueDate?.trim() || null,
      startDate: values.startDate?.trim() || null,
      endDate: values.endDate?.trim() || null,
      timeEstimate: values.timeEstimate ?? null,
      metricTarget: values.metricTarget ?? null,
      metricUnit: values.metricUnit?.trim() || null,
    };
    try {
      if (isEdit && task) {
        await updateMutation.mutateAsync({ id: task.id, patch: payload });
        toast({ title: t("tasks.taskUpdated"), description: payload.title });
      } else {
        await createMutation.mutateAsync(payload as any);
        toast({ title: t("tasks.taskCreated"), description: payload.title });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({ 
        title: t("errors.somethingWentWrong"), 
        description: e?.message ?? t("errors.tryAgain"), 
        variant: "destructive" 
      });
    }
  }

  const progress = form.watch("progress");
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-task">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("tasks.editTask") : t("tasks.newTask")}</DialogTitle>
          <DialogDescription>
            {t("tasks.taskDialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">{t("tasks.title")}</Label>
            <Input
              id="title"
              autoFocus
              placeholder={t("tasks.titlePlaceholder")}
              data-testid="input-title"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("tasks.period")}</Label>
              <Select
                value={form.watch("period")}
                onValueChange={(v) => form.setValue("period", v as any)}
              >
                <SelectTrigger data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t("tasks.day")}</SelectItem>
                  <SelectItem value="month">{t("tasks.month")}</SelectItem>
                  <SelectItem value="year">{t("tasks.year")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("tasks.priority")}</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) => form.setValue("priority", v as any)}
              >
                <SelectTrigger data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("tasks.low")}</SelectItem>
                  <SelectItem value="medium">{t("tasks.medium")}</SelectItem>
                  <SelectItem value="high">{t("tasks.high")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("tasks.status")}</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as any)}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">{t("tasks.todo")}</SelectItem>
                  <SelectItem value="in_progress">{t("tasks.inProgress")}</SelectItem>
                  <SelectItem value="done">{t("tasks.done")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("tasks.category")}</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(v) => form.setValue("category", v)}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Work">{t("tasks.work")}</SelectItem>
                  <SelectItem value="Health">{t("tasks.health")}</SelectItem>
                  <SelectItem value="Learning">{t("tasks.learning")}</SelectItem>
                  <SelectItem value="Personal">{t("tasks.personal")}</SelectItem>
                  <SelectItem value="Finance">{t("tasks.finance")}</SelectItem>
                  <SelectItem value="Creative">{t("tasks.creative")}</SelectItem>
                  <SelectItem value="General">{t("tasks.general")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="progress">{t("tasks.progress")}</Label>
              <span 
                className="tabular-nums text-sm text-muted-foreground" 
                data-testid="text-progress-value"
              >
                {progress}%
              </span>
            </div>
            <Slider
              id="progress"
              min={0}
              max={100}
              step={5}
              value={[progress]}
              onValueChange={(v) => form.setValue("progress", v[0])}
              data-testid="slider-progress"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">{t("tasks.startDate")}</Label>
              <Input
                id="startDate"
                type="date"
                data-testid="input-start-date"
                {...form.register("startDate")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">{t("tasks.endDate")}</Label>
              <Input
                id="endDate"
                type="date"
                data-testid="input-end-date"
                {...form.register("endDate")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("tasks.duration")}</Label>
              {durationDisplay ? (
                <div className="text-sm border rounded-md py-2 px-3 min-h-[40px] flex items-center">
                  {durationDisplay}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground border rounded-md py-2 px-3 min-h-[40px] flex items-center">
                  {t("tasks.noDuration")}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">{t("tasks.dueDate")}</Label>
              <Input
                id="dueDate"
                type="date"
                data-testid="input-due-date"
                {...form.register("dueDate")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timeEstimate">{t("tasks.timeEstimate")}</Label>
              <Input
                id="timeEstimate"
                type="number"
                min={0}
                placeholder="30"
                data-testid="input-time-estimate"
                {...form.register("timeEstimate")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="metricTarget">{t("tasks.metricTarget")}</Label>
              <Input
                id="metricTarget"
                type="number"
                min={0}
                placeholder="e.g. 60"
                data-testid="input-metric-target"
                {...form.register("metricTarget")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="metricUnit">{t("tasks.metricUnit")}</Label>
              <Input
                id="metricUnit"
                placeholder={t("tasks.metricUnitPlaceholder")}
                data-testid="input-metric-unit"
                {...form.register("metricUnit")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("tasks.notes")}</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder={t("tasks.notesPlaceholder")}
              data-testid="input-notes"
              {...form.register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-task"
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-task">
              {isPending 
                ? t("common.loading") 
                : isEdit 
                  ? t("common.saveChanges") 
                  : t("tasks.createTask")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
