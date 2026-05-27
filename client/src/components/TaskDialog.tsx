import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTaskSchema, type Task, CATEGORIES } from "@shared/schema";
import { useCreateTask, useUpdateTask } from "@/lib/tasks";
import { useToast } from "@/hooks/use-toast";
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

const formSchema = insertTaskSchema.extend({
  notes: z.string().max(2000).optional(),
  dueDate: z.string().optional(),
  timeEstimate: z.coerce.number().int().min(0).optional().nullable(),
  metricTarget: z.coerce.number().int().min(0).optional().nullable(),
  metricUnit: z.string().max(20).optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

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
  const isEdit = !!task;
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      notes: "",
      period: defaultPeriod,
      status: "todo",
      progress: 0,
      priority: "medium",
      category: "Work",
      dueDate: "",
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
        timeEstimate: undefined,
        metricTarget: undefined,
        metricUnit: "",
      });
    }
  }, [task, open, defaultPeriod, form]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      notes: values.notes?.trim() || null,
      dueDate: values.dueDate?.trim() || null,
      timeEstimate: values.timeEstimate ?? null,
      metricTarget: values.metricTarget ?? null,
      metricUnit: values.metricUnit?.trim() || null,
    };
    try {
      if (isEdit && task) {
        await updateMutation.mutateAsync({ id: task.id, patch: payload });
        toast({ title: "Task updated", description: payload.title });
      } else {
        await createMutation.mutateAsync(payload as any);
        toast({ title: "Task created", description: payload.title });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ?? "Try again", variant: "destructive" });
    }
  }

  const progress = form.watch("progress");
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-task">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            Track work across day, month, and year — keep your tempo steady.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              autoFocus
              placeholder="e.g. Review Q3 metrics"
              data-testid="input-title"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Period</Label>
              <Select
                value={form.watch("period")}
                onValueChange={(v) => form.setValue("period", v as any)}
              >
                <SelectTrigger data-testid="select-period"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.watch("priority")}
                onValueChange={(v) => form.setValue("priority", v as any)}
              >
                <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as any)}
              >
                <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To do</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.watch("category")}
                onValueChange={(v) => form.setValue("category", v)}
              >
                <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="progress">Progress</Label>
              <span className="tabular-nums text-sm text-muted-foreground" data-testid="text-progress-value">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Target date</Label>
              <Input
                id="dueDate"
                type="date"
                data-testid="input-due-date"
                {...form.register("dueDate")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timeEstimate">Time estimate (min)</Label>
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
              <Label htmlFor="metricTarget">Metric target</Label>
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
              <Label htmlFor="metricUnit">Unit</Label>
              <Input
                id="metricUnit"
                placeholder="km, books, USD…"
                data-testid="input-metric-unit"
                {...form.register("metricUnit")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Optional context, links, or sub-steps…"
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
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-save-task">
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
