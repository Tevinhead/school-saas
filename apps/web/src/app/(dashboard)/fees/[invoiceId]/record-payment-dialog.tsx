"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  method: z.enum(["cash", "bank_transfer", "card", "cheque"]),
  referenceNumber: z.string().optional(),
  receivedAt: z.string().min(1, "Date is required"),
});

type PaymentValues = z.infer<typeof paymentSchema>;

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  outstandingAmount: number;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  outstandingAmount,
}: RecordPaymentDialogProps) {
  const utils = trpc.useUtils();

  const recordMutation = trpc.fees.recordPayment.useMutation({
    onSuccess: () => {
      utils.fees.getInvoiceById.invalidate({ id: invoiceId });
      utils.fees.listInvoices.invalidate();
      utils.fees.getFeeStats.invalidate();
      onOpenChange(false);
      toast.success("Payment recorded");
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: outstandingAmount > 0 ? outstandingAmount.toString() : "",
      method: "cash",
      referenceNumber: "",
      receivedAt: new Date().toISOString().split("T")[0],
    },
  });

  function onSubmit(values: PaymentValues) {
    recordMutation.mutate({
      invoiceId,
      amount: parseFloat(values.amount),
      method: values.method,
      referenceNumber: values.referenceNumber || undefined,
      receivedAt: new Date(values.receivedAt),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        { value: "cash", label: "Cash" },
                        { value: "bank_transfer", label: "Bank Transfer" },
                        { value: "card", label: "Card" },
                        { value: "cheque", label: "Cheque" },
                      ].map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="TXN-12345" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="receivedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Received</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={recordMutation.isPending}>
                {recordMutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
