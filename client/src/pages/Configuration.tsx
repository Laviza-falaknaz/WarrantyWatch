import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Settings, 
  Percent, 
  Calendar, 
  Bell, 
  RefreshCw, 
  TrendingUp,
  Lock,
  Webhook,
  AlertTriangle,
  Timer,
  BarChart3
} from "lucide-react";
import type { AppConfiguration } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
  alertWebhookUrl: z.string().url().optional().or(z.literal('')),
  password: z.string().min(1, "Password is required to update configuration"),
});

type ConfigurationFormValues = z.infer<typeof configurationFormSchema>;

export default function Configuration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("thresholds");

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
      alertWebhookUrl: '',
      password: '',
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
        alertWebhookUrl: configuration.alertWebhookUrl || '',
        password: '',
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
      form.setValue('password', '');
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
      <div className="h-full flex flex-col">
        <div className="border-b bg-background px-8 py-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              System Configuration
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage thresholds, alerts, analytics, and integrations for your coverage pool system
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Lock className="h-3 w-3 mr-1" />
            Admin Access Required
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 h-auto p-1">
                <TabsTrigger value="thresholds" className="flex items-center gap-2 py-3" data-testid="tab-thresholds">
                  <Percent className="h-4 w-4" />
                  <span className="hidden sm:inline">Thresholds</span>
                </TabsTrigger>
                <TabsTrigger value="timeframes" className="flex items-center gap-2 py-3" data-testid="tab-timeframes">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Timeframes</span>
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex items-center gap-2 py-3" data-testid="tab-alerts">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Alerts</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2 py-3" data-testid="tab-analytics">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="flex items-center gap-2 py-3" data-testid="tab-integrations">
                  <Webhook className="h-4 w-4" />
                  <span className="hidden sm:inline">Integrations</span>
                </TabsTrigger>
              </TabsList>

              {/* Thresholds Tab */}
              <TabsContent value="thresholds" className="space-y-6" data-testid="content-thresholds">
                <Card className="rounded-2xl border">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Percent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">Coverage Thresholds</CardTitle>
                        <CardDescription className="mt-1">
                          Define the critical thresholds that determine when coverage levels require attention
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <FormField
                        control={form.control}
                        name="lowCoverageThresholdPercent"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <FormLabel className="text-base font-semibold">Low Coverage Alert Threshold</FormLabel>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="text-lg h-12 pr-12"
                                  placeholder="10.00"
                                  {...field}
                                  data-testid="input-low-coverage-threshold"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                  %
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-sm">
                              Pools below this coverage ratio will trigger low coverage alerts and appear in risk analysis
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="targetCoveragePercent"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-accent" />
                              <FormLabel className="text-base font-semibold">Target Coverage Goal</FormLabel>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.01"
                                  className="text-lg h-12 pr-12"
                                  placeholder="20.00"
                                  {...field}
                                  data-testid="input-target-coverage-percent"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                  %
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-sm">
                              Optimal spare-to-covered ratio that the system should aim to maintain
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6" />

                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <BarChart3 className="h-4 w-4" />
                        <span>How Thresholds Work</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                        <li>Low coverage threshold identifies at-risk equipment combinations</li>
                        <li>Target coverage guides pool creation and inventory recommendations</li>
                        <li>Differences between actual and target coverage highlight optimization opportunities</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timeframes Tab */}
              <TabsContent value="timeframes" className="space-y-6" data-testid="content-timeframes">
                <Card className="rounded-2xl border">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">Time Period Settings</CardTitle>
                        <CardDescription className="mt-1">
                          Configure time windows for expiration monitoring and activity tracking
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <FormField
                        control={form.control}
                        name="expiringCoverageDays"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4 text-secondary" />
                              <FormLabel className="text-base font-semibold">Coverage Expiration Window</FormLabel>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  className="text-lg h-12 pr-16"
                                  placeholder="30"
                                  {...field}
                                  data-testid="input-expiring-coverage-days"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                  days
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-sm">
                              Show "expiring soon" alerts when warranties end within this timeframe
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="poolInactivityDays"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-4 w-4 text-secondary" />
                              <FormLabel className="text-base font-semibold">Pool Inactivity Period</FormLabel>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  className="text-lg h-12 pr-16"
                                  placeholder="90"
                                  {...field}
                                  data-testid="input-pool-inactivity-days"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                  days
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-sm">
                              Mark pools as inactive after this many days without modifications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="runRatePeriodMonths"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-secondary" />
                              <FormLabel className="text-base font-semibold">Run Rate Analysis Period</FormLabel>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  className="text-lg h-12 pr-20"
                                  placeholder="6"
                                  {...field}
                                  data-testid="input-run-rate-period-months"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                  months
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-sm">
                              Historical period for calculating monthly claims run rates (1-24 months)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dashboardRefreshMinutes"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-4 w-4 text-secondary" />
                              <FormLabel className="text-base font-semibold">Dashboard Auto-Refresh</FormLabel>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  className="text-lg h-12 pr-16"
                                  placeholder="5"
                                  {...field}
                                  data-testid="input-dashboard-refresh-minutes"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                  min
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-sm">
                              How often dashboard data refreshes automatically (1-60 minutes)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="space-y-6" data-testid="content-alerts">
                <Card className="rounded-2xl border">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Bell className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">Alert Preferences</CardTitle>
                        <CardDescription className="mt-1">
                          Control which automated alerts and notifications are enabled throughout the system
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="enableLowCoverageAlerts"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl border p-6 bg-card hover-elevate transition-all">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <FormLabel className="text-base font-semibold cursor-pointer">
                                Low Coverage Alerts
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Display prominent alerts when coverage pools fall below the configured threshold percentage
                              </FormDescription>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-enable-low-coverage-alerts"
                              className="ml-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="enableExpiringAlerts"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-xl border p-6 bg-card hover-elevate transition-all">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-2 bg-secondary/10 rounded-lg">
                              <Timer className="h-5 w-5 text-secondary" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <FormLabel className="text-base font-semibold cursor-pointer">
                                Expiring Coverage Alerts
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Show alerts for warranties approaching their expiration date within the configured window
                              </FormDescription>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-enable-expiring-alerts"
                              className="ml-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6" data-testid="content-analytics">
                <Card className="rounded-2xl border">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">Analytics & Forecasting</CardTitle>
                        <CardDescription className="mt-1">
                          Configure parameters for trend analysis, demand forecasting, and predictive insights
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <FormField
                        control={form.control}
                        name="analyticsTimeRangeMonths"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-accent" />
                              <FormLabel className="text-base font-semibold">Historical Analysis Period</FormLabel>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  className="text-lg h-12 pr-20"
                                  placeholder="12"
                                  {...field}
                                  data-testid="input-analytics-time-range"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                  months
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-sm">
                              Amount of historical data used for trend analysis in coverage pool analytics (1-36 months)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="analyticsForecastMonths"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-accent" />
                              <FormLabel className="text-base font-semibold">Future Forecast Window</FormLabel>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  className="text-lg h-12 pr-20"
                                  placeholder="3"
                                  {...field}
                                  data-testid="input-analytics-forecast-months"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                  months
                                </span>
                              </div>
                            </FormControl>
                            <FormDescription className="text-sm">
                              Number of months to project future demand in forecasting models (1-12 months)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6" />

                    <div className="bg-accent/10 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-accent">
                        <TrendingUp className="h-4 w-4" />
                        <span>Analytics Impact</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        These settings control the time ranges used in pool detail dashboards, including trend charts, 
                        growth calculations, and demand projections. Longer periods provide more stable trends but may miss recent changes.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations" className="space-y-6" data-testid="content-integrations">
                <Card className="rounded-2xl border">
                  <CardHeader className="border-b bg-muted/30">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Webhook className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">Power Automate Integration</CardTitle>
                        <CardDescription className="mt-1">
                          Connect to external automation workflows for high-risk alerts and notifications
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="alertWebhookUrl"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base font-semibold">Webhook Endpoint URL</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              className="text-base h-12 font-mono"
                              placeholder="https://prod-xx.eastus.logic.azure.com:443/workflows/..."
                              {...field}
                              data-testid="input-alert-webhook-url"
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
                            Power Automate webhook URL that receives structured JSON payloads when high-risk combination alerts are triggered
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Webhook className="h-4 w-4" />
                        <span>Webhook Payload Structure</span>
                      </div>
                      <pre className="text-xs bg-background rounded-lg p-3 overflow-x-auto border">
{`{
  "alertType": "high-risk-combination",
  "timestamp": "2025-11-10T10:30:00Z",
  "combinations": [
    {
      "make": "DELL",
      "model": "LATITUDE 5490",
      "processor": "CORE I5",
      "riskLevel": "Critical",
      "coverageRatio": "23.81%",
      "monthlyRunRate": 1.67
    }
  ]
}`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-destructive/20 bg-destructive/5">
                  <CardHeader className="border-b border-destructive/20">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-destructive/10 rounded-xl">
                        <Lock className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl text-destructive">Security Authentication</CardTitle>
                        <CardDescription className="mt-1">
                          Admin password required to save configuration changes
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-base font-semibold">Admin Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              className="text-base h-12"
                              placeholder="Enter password to authorize changes"
                              {...field}
                              data-testid="input-admin-password"
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
                            Password authentication is required to update any configuration settings across all tabs
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Fixed Action Bar */}
            <div className="sticky bottom-0 -mx-8 -mb-8 mt-8 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-8 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Changes will apply immediately after saving
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={updateConfigMutation.isPending}
                    data-testid="button-reset"
                  >
                    Reset to Saved
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateConfigMutation.isPending}
                    data-testid="button-save"
                    className="min-w-40"
                  >
                    {updateConfigMutation.isPending ? "Saving Changes..." : "Save Configuration"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
