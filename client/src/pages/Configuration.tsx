import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Percent, Calendar, Bell, RefreshCw, TrendingUp } from "lucide-react";
import type { AppConfiguration } from "@shared/schema";

const configurationFormSchema = z.object({
  lowCoverageThresholdPercent: z.coerce.number().min(0).max(100),
  targetCoveragePercent: z.coerce.number().min(0).max(100),
  expiringCoverageDays: z.coerce.number().int().min(1).max(365),
  poolInactivityDays: z.coerce.number().int().min(1).max(365),
  runRatePeriodMonths: z.coerce.number().int().min(1).max(24),
  analyticsTimeRangeMonths: z.coerce.number().int().min(1).max(36),
  analyticsForecastMonths: z.coerce.number().int().min(1).max(12),
  enableLowCoverageAlerts: z.boolean(),
  enableExpiringAlerts: z.boolean(),
  dashboardRefreshMinutes: z.coerce.number().int().min(1).max(60),
});

type ConfigurationFormValues = z.infer<typeof configurationFormSchema>;

export default function Configuration() {
  const { toast } = useToast();

  const { data: configuration, isLoading } = useQuery<AppConfiguration>({
    queryKey: ["/api/configuration"],
  });

  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(configurationFormSchema),
    defaultValues: {
      lowCoverageThresholdPercent: 10,
      targetCoveragePercent: 20,
      expiringCoverageDays: 30,
      poolInactivityDays: 90,
      runRatePeriodMonths: 6,
      analyticsTimeRangeMonths: 12,
      analyticsForecastMonths: 3,
      enableLowCoverageAlerts: true,
      enableExpiringAlerts: true,
      dashboardRefreshMinutes: 5,
    },
  });

  useEffect(() => {
    if (configuration) {
      form.reset({
        lowCoverageThresholdPercent: Number(configuration.lowCoverageThresholdPercent),
        targetCoveragePercent: Number(configuration.targetCoveragePercent),
        expiringCoverageDays: configuration.expiringCoverageDays,
        poolInactivityDays: configuration.poolInactivityDays,
        runRatePeriodMonths: configuration.runRatePeriodMonths,
        analyticsTimeRangeMonths: configuration.analyticsTimeRangeMonths,
        analyticsForecastMonths: configuration.analyticsForecastMonths,
        enableLowCoverageAlerts: configuration.enableLowCoverageAlerts,
        enableExpiringAlerts: configuration.enableExpiringAlerts,
        dashboardRefreshMinutes: configuration.dashboardRefreshMinutes,
      });
    }
  }, [configuration, form]);

  const updateConfigMutation = useMutation({
    mutationFn: async (data: ConfigurationFormValues) => {
      return await apiRequest("PATCH", "/api/configuration", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuration"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coverage-pools-with-stats"] });
      toast({
        title: "Configuration updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConfigurationFormValues) => {
    updateConfigMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system settings and preferences
          </p>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system settings and preferences
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card data-testid="card-coverage-thresholds">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Coverage Thresholds
              </CardTitle>
              <CardDescription>
                Configure thresholds for coverage alerts and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="lowCoverageThresholdPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Coverage Threshold (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="10.00"
                        {...field}
                        data-testid="input-low-coverage-threshold"
                      />
                    </FormControl>
                    <FormDescription>
                      Coverage pools below this percentage will be marked as low coverage (e.g., 6 for 6%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="targetCoveragePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Coverage Percentage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="20.00"
                        {...field}
                        data-testid="input-target-coverage-percent"
                      />
                    </FormControl>
                    <FormDescription>
                      Target spare-to-covered ratio for optimal inventory coverage (e.g., 5 for 5% or 20 for 20%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card data-testid="card-expiry-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Expiry Settings
              </CardTitle>
              <CardDescription>
                Configure how the system handles coverage and pool expiration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="expiringCoverageDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiring Coverage Alert Period (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        data-testid="input-expiring-coverage-days"
                      />
                    </FormControl>
                    <FormDescription>
                      Show "expiring soon" alerts when coverage ends within this many days
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="poolInactivityDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pool Inactivity Period (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="90"
                        {...field}
                        data-testid="input-pool-inactivity-days"
                      />
                    </FormControl>
                    <FormDescription>
                      Mark coverage pools as inactive after this many days of no modifications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="runRatePeriodMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Run Rate Calculation Period (Months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="6"
                        {...field}
                        data-testid="input-run-rate-period-months"
                      />
                    </FormControl>
                    <FormDescription>
                      Calculate claims run rate based on this many months of history (1-24 months)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card data-testid="card-alert-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Settings
              </CardTitle>
              <CardDescription>
                Control which alerts and notifications are enabled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="enableLowCoverageAlerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Low Coverage Alerts</FormLabel>
                      <FormDescription>
                        Show alerts when coverage pools fall below the threshold
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-enable-low-coverage-alerts"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enableExpiringAlerts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Expiring Coverage Alerts</FormLabel>
                      <FormDescription>
                        Show alerts when coverage is expiring soon
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-enable-expiring-alerts"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card data-testid="card-analytics-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics Settings
              </CardTitle>
              <CardDescription>
                Configure parameters for trend analysis and forecasting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="analyticsTimeRangeMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analytics Time Range (Months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="12"
                        {...field}
                        data-testid="input-analytics-time-range"
                      />
                    </FormControl>
                    <FormDescription>
                      Historical data period for trend analysis in coverage pool analytics (1-36 months)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="analyticsForecastMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forecast Period (Months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3"
                        {...field}
                        data-testid="input-analytics-forecast-months"
                      />
                    </FormControl>
                    <FormDescription>
                      Number of months to project future demand in forecasting models (1-12 months)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card data-testid="card-display-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Display Settings
              </CardTitle>
              <CardDescription>
                Configure how data is displayed in the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="dashboardRefreshMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dashboard Refresh Interval (Minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5"
                        {...field}
                        data-testid="input-dashboard-refresh-minutes"
                      />
                    </FormControl>
                    <FormDescription>
                      How often the dashboard data should refresh automatically (1-60 minutes)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              data-testid="button-reset"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={updateConfigMutation.isPending}
              data-testid="button-save"
            >
              {updateConfigMutation.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
