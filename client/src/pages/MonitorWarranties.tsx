import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function MonitorWarranties() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monitor Warranties</h1>
        <p className="text-muted-foreground mt-2">
          Real-time warranty monitoring and alerts
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            This page will provide real-time warranty monitoring, alerts, and proactive notifications
            for coverage management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Features in development:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Real-time warranty status monitoring</li>
            <li>Automated expiration alerts</li>
            <li>Coverage gap notifications</li>
            <li>Threshold-based warnings</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
