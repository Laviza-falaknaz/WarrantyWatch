import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Shield,
  AlertCircle,
  RefreshCw,
  Search,
  Download,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

export default function ExploreDashboard() {
  const [activeTab, setActiveTab] = useState("warranties");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: warranties, isLoading: warrantiesLoading } = useQuery({
    queryKey: ["/api/covered-units"],
  });

  const { data: stock, isLoading: stockLoading } = useQuery({
    queryKey: ["/api/spare-units"],
  });

  const { data: availableStock, isLoading: availableStockLoading } = useQuery({
    queryKey: ["/api/available-stock"],
  });

  const { data: claims, isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/claims"],
  });

  const { data: replacements, isLoading: replacementsLoading } = useQuery({
    queryKey: ["/api/replacements"],
  });

  const { data: pools, isLoading: poolsLoading } = useQuery({
    queryKey: ["/api/coverage-pools"],
  });

  // Summary stats
  const stats = {
    totalWarranties: Array.isArray(warranties) ? warranties.length : 0,
    activeWarranties: Array.isArray(warranties) ? warranties.filter((w: any) => w.isCoverageActive).length : 0,
    totalStock: Array.isArray(stock) ? stock.length : 0,
    availableUnits: Array.isArray(availableStock) ? availableStock.length : 0,
    totalClaims: Array.isArray(claims) ? claims.length : 0,
    totalReplacements: Array.isArray(replacements) ? replacements.length : 0,
    totalPools: Array.isArray(pools) ? pools.length : 0,
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-4xl font-bold mb-2">Explore</h1>
        <p className="text-muted-foreground">
          Comprehensive BI report - Navigate warranties, stock, claims, replacements, and pools
        </p>
      </motion.div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Shield className="w-4 h-4 text-primary" />
                  <Badge variant="outline" className="text-xs">Total</Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-warranties">{stats.totalWarranties}</p>
                  <p className="text-xs text-muted-foreground">Warranties</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-active-warranties">{stats.activeWarranties}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Package className="w-4 h-4 text-secondary" />
                  <Badge variant="outline" className="text-xs">Stock</Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-stock">{stats.totalStock}</p>
                  <p className="text-xs text-muted-foreground">Spare Units</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <Badge variant="outline" className="text-xs">Available</Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-available-stock">{stats.availableUnits}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <Badge variant="outline" className="text-xs">Claims</Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-claims">{stats.totalClaims}</p>
                  <p className="text-xs text-muted-foreground">Claims</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <Badge variant="outline" className="text-xs">Replaced</Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-replacements">{stats.totalReplacements}</p>
                  <p className="text-xs text-muted-foreground">Replacements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <Badge variant="outline" className="text-xs">Pools</Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-pools">{stats.totalPools}</p>
                  <p className="text-xs text-muted-foreground">Coverage Pools</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Exploration Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Data Explorer</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search all data..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-explorer"
                  />
                </div>
                <Button variant="outline" size="icon" data-testid="button-export-data">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="warranties" data-testid="tab-warranties">Warranties</TabsTrigger>
                <TabsTrigger value="stock" data-testid="tab-stock">Spare Stock</TabsTrigger>
                <TabsTrigger value="available" data-testid="tab-available">Available</TabsTrigger>
                <TabsTrigger value="claims" data-testid="tab-claims">Claims</TabsTrigger>
                <TabsTrigger value="replacements" data-testid="tab-replacements">Replacements</TabsTrigger>
                <TabsTrigger value="pools" data-testid="tab-pools">Pools</TabsTrigger>
              </TabsList>

              {/* Warranties Tab */}
              <TabsContent value="warranties" className="mt-6">
                {warrantiesLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Make/Model</TableHead>
                          <TableHead>Coverage End</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(warranties) && warranties.slice(0, 10).map((warranty: any) => (
                          <TableRow key={warranty.id} data-testid={`row-warranty-${warranty.id}`}>
                            <TableCell className="font-medium">{warranty.orderNumber || 'N/A'}</TableCell>
                            <TableCell>{warranty.customerName || 'N/A'}</TableCell>
                            <TableCell>{warranty.make} {warranty.model}</TableCell>
                            <TableCell>{warranty.coverageEndDate ? format(new Date(warranty.coverageEndDate), 'MMM d, yyyy') : 'N/A'}</TableCell>
                            <TableCell>
                              {warranty.isCoverageActive ? (
                                <Badge variant="default">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Spare Stock Tab */}
              <TabsContent value="stock" className="mt-6">
                {stockLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset Tag</TableHead>
                          <TableHead>Serial</TableHead>
                          <TableHead>Make/Model</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(stock) && stock.slice(0, 10).map((item: any) => (
                          <TableRow key={item.id} data-testid={`row-stock-${item.id}`}>
                            <TableCell className="font-medium">{item.assetTag || 'N/A'}</TableCell>
                            <TableCell>{item.serialNumber || 'N/A'}</TableCell>
                            <TableCell>{item.make} {item.model}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.currentStatus || 'Available'}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Available Stock Tab */}
              <TabsContent value="available" className="mt-6">
                {availableStockLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Make/Model</TableHead>
                          <TableHead>Total Stock</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Reserved</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(availableStock) && availableStock.slice(0, 10).map((item: any, index: number) => (
                          <TableRow key={index} data-testid={`row-available-${index}`}>
                            <TableCell className="font-medium">{item.make} {item.model}</TableCell>
                            <TableCell>{item.totalStock || 0}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-accent/10">{item.availableStock || 0}</Badge>
                            </TableCell>
                            <TableCell>{item.reservedStock || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Claims Tab */}
              <TabsContent value="claims" className="mt-6">
                {claimsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Claim Date</TableHead>
                          <TableHead>Make/Model</TableHead>
                          <TableHead>Order #</TableHead>
                          <TableHead>Customer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(claims) && claims.slice(0, 10).map((claim: any, index: number) => (
                          <TableRow key={index} data-testid={`row-claim-${index}`}>
                            <TableCell>{claim.claimDate ? format(new Date(claim.claimDate), 'MMM d, yyyy') : 'N/A'}</TableCell>
                            <TableCell className="font-medium">{claim.make} {claim.model}</TableCell>
                            <TableCell>{claim.orderNumber || 'N/A'}</TableCell>
                            <TableCell>{claim.customerName || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Replacements Tab */}
              <TabsContent value="replacements" className="mt-6">
                {replacementsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Replacement Date</TableHead>
                          <TableHead>Make/Model</TableHead>
                          <TableHead>Order #</TableHead>
                          <TableHead>Customer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(replacements) && replacements.slice(0, 10).map((replacement: any, index: number) => (
                          <TableRow key={index} data-testid={`row-replacement-${index}`}>
                            <TableCell>{replacement.replacementDate ? format(new Date(replacement.replacementDate), 'MMM d, yyyy') : 'N/A'}</TableCell>
                            <TableCell className="font-medium">{replacement.make} {replacement.model}</TableCell>
                            <TableCell>{replacement.orderNumber || 'N/A'}</TableCell>
                            <TableCell>{replacement.customerName || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Pools Tab */}
              <TabsContent value="pools" className="mt-6">
                {poolsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pool Name</TableHead>
                          <TableHead>Coverage %</TableHead>
                          <TableHead>Covered Units</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(pools) && pools.slice(0, 10).map((pool: any) => (
                          <TableRow key={pool.id} data-testid={`row-pool-${pool.id}`}>
                            <TableCell className="font-medium">{pool.poolName}</TableCell>
                            <TableCell>{Math.round(pool.coverageRatio || 0)}%</TableCell>
                            <TableCell>{pool.coveredUnitCount || 0}</TableCell>
                            <TableCell>
                              <Badge variant={pool.coverageRatio >= 80 ? "default" : "destructive"}>
                                {pool.coverageRatio >= 80 ? 'Healthy' : 'Low Coverage'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
