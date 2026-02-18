"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc/client";
import { schoolInfoSchema, type SchoolInfoValues } from "@school-saas/validators";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

interface SchoolInfoStepProps {
  onNext: () => void;
}

export function SchoolInfoStep({ onNext }: SchoolInfoStepProps) {
  const createSchool = trpc.onboarding.createSchool.useMutation({
    onSuccess: () => {
      toast.success("School created");
      onNext();
    },
    onError: (error) => {
      toast.error(error.message ?? "Something went wrong");
    },
  });

  const form = useForm<SchoolInfoValues>({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      name: "",
      timezone: "UTC",
      defaultLocale: "en",
      defaultCurrency: "USD",
      academicYearStartMonth: "09",
    },
  });

  function onSubmit(values: SchoolInfoValues) {
    createSchool.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Raintree International School" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Asia/Bangkok" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultLocale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Locale</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="en" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="defaultCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="USD" maxLength={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="academicYearStartMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Academic Year Start</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MONTHS.map((m) => (
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
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={createSchool.isPending}>
            {createSchool.isPending ? "Creating..." : "Next"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
