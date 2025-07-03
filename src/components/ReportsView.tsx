import React, { useState } from "react";
import { Filter, Download, BarChart3, Check, X, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Visit {
  id: number;
  dpc: string;
  region: string;
  createdBy: string;
  date: string;
  retailerCode: string;
  retailerName: string;
  city: string;
  state: string;
  visitType: string;
  approved: boolean;
  approvalDate: string;
  receivedDate: string;
  transportation: string;
}

interface DPCData {
  name: string;
  region: string;
  target: number;
}

interface User {
  role: string;
  name: string;
  region: string;
}

interface ReportFilters {
  dateRange: string;
  dpc: string;
  region: string;
  visitType: string;
  approvalStatus: string;
}

interface PerformanceMetric {
  name: string;
  region: string;
  target: number;
  totalVisits: number;
  scheduledVisits: number;
  approvedVisits: number;
  percentage: number;
  onSiteRetailer: number;
  onSiteCorporate: number;
  virtual: number;
  onsiteZone: number;
  training: number;
  specialProjects: number;
  pendingApproval: number;
}

interface VisitTypeData {
  name: string;
  value: number;
  color: string;
}

interface ReportsViewProps {
  visits: Visit[];
  dpcData: DPCData[];
  currentUser: User;
  reportFilters: ReportFilters;
  setReportFilters: React.Dispatch<React.SetStateAction<ReportFilters>>;
  setSelectedVisit: (visit: Visit | null) => void;
}

const visitUtils = {
  isVisitApproved: (visit: Visit) =>
    !!(visit.receivedDate && visit.receivedDate.trim()),
  getFilteredVisits: (visits: Visit[], filters: ReportFilters, user: User) => {
    let filtered = visits;
    if (user.role === "dpc") {
      filtered = filtered.filter((visit) => visit.dpc === user.name);
    }
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    if (filters.dateRange === "thisMonth") {
      filtered = filtered.filter((visit) => {
        const visitDate = new Date(visit.date);
        return (
          visitDate.getMonth() === currentMonth &&
          visitDate.getFullYear() === currentYear
        );
      });
    } else if (filters.dateRange === "lastMonth") {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      filtered = filtered.filter((visit) => {
        const visitDate = new Date(visit.date);
        return (
          visitDate.getMonth() === lastMonth &&
          visitDate.getFullYear() === lastMonthYear
        );
      });
    } else if (filters.dateRange === "last3Months") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      filtered = filtered.filter(
        (visit) => new Date(visit.date) >= threeMonthsAgo,
      );
    }
    if (filters.dpc !== "all")
      filtered = filtered.filter((visit) => visit.dpc === filters.dpc);
    if (filters.region !== "all")
      filtered = filtered.filter((visit) => visit.region === filters.region);
    if (filters.visitType !== "all")
      filtered = filtered.filter(
        (visit) => visit.visitType === filters.visitType,
      );
    if (filters.approvalStatus !== "all") {
      if (filters.approvalStatus === "approved")
        filtered = filtered.filter(visitUtils.isVisitApproved);
      else if (filters.approvalStatus === "pending")
        filtered = filtered.filter((v) => !visitUtils.isVisitApproved(v));
    }
    return filtered;
  },
  calculatePerformanceMetrics: (
    visits: Visit[],
    dpcData: DPCData[],
    user: User,
  ) => {
    const dpcPerformance: Record<string, PerformanceMetric> = {};
    dpcData.forEach((dpc) => {
      const dpcVisits = visits.filter((visit) => visit.dpc === dpc.name);
      const approvedVisits = dpcVisits.filter(visitUtils.isVisitApproved);
      const scheduledVisitTypes = [
        "On-Site Retailer",
        "On-Site Corporate",
        "Virtual",
        "Onsite Zone",
      ];
      const scheduledVisits = dpcVisits.filter((visit) =>
        scheduledVisitTypes.includes(visit.visitType),
      );
      dpcPerformance[dpc.name] = {
        name: dpc.name,
        region: dpc.region,
        target: dpc.target,
        totalVisits: dpcVisits.length,
        scheduledVisits: scheduledVisits.length,
        approvedVisits: approvedVisits.length,
        percentage: Math.round((approvedVisits.length / dpc.target) * 100),
        onSiteRetailer: approvedVisits.filter(
          (visit) => visit.visitType === "On-Site Retailer",
        ).length,
        onSiteCorporate: approvedVisits.filter(
          (visit) => visit.visitType === "On-Site Corporate",
        ).length,
        virtual: approvedVisits.filter((visit) => visit.visitType === "Virtual")
          .length,
        onsiteZone: approvedVisits.filter(
          (visit) => visit.visitType === "Onsite Zone",
        ).length,
        training: approvedVisits.filter(
          (visit) => visit.visitType === "Training/T3",
        ).length,
        specialProjects: approvedVisits.filter(
          (visit) => visit.visitType === "Special Projects",
        ).length,
        pendingApproval: dpcVisits.filter(
          (visit) => !visitUtils.isVisitApproved(visit),
        ).length,
      };
    });
    return Object.values(dpcPerformance);
  },
  isVisitOverdue: (visit: Visit) => {
    if (visitUtils.isVisitApproved(visit)) return false;
    const today = new Date();
    const visitDate = new Date(visit.date + "T00:00:00");
    let daysOverdue = 0;
    let curr = new Date(visitDate);
    curr.setDate(curr.getDate() + 1);
    while (curr <= today) {
      const day = curr.getDay();
      if (day !== 0 && day !== 6) daysOverdue++;
      curr.setDate(curr.getDate() + 1);
    }
    return daysOverdue >= 2;
  },
};

const ReportsView: React.FC<ReportsViewProps> = ({
  visits = [],
  dpcData = [],
  currentUser = { role: "dpc", name: "Default User", region: "Default Region" },
  reportFilters = {
    dateRange: "thisMonth",
    dpc: "all",
    region: "all",
    visitType: "all",
    approvalStatus: "all",
  },
  setReportFilters = () => {},
  setSelectedVisit = () => {},
}) => {
  const filteredVisits = visitUtils.getFilteredVisits(
    visits,
    reportFilters,
    currentUser,
  );
  const performanceData = visitUtils.calculatePerformanceMetrics(
    visits,
    dpcData,
    currentUser,
  );

  const getVisitTypeData = (): VisitTypeData[] => {
    const approvedVisits = filteredVisits.filter(visitUtils.isVisitApproved);
    const visitTypes: Record<string, number> = {};
    approvedVisits.forEach((visit) => {
      visitTypes[visit.visitType] = (visitTypes[visit.visitType] || 0) + 1;
    });
    return Object.entries(visitTypes).map(([type, count]) => ({
      name: type,
      value: count,
      color:
        {
          "On-Site Retailer": "#3B82F6",
          "On-Site Corporate": "#10B981",
          Virtual: "#8B5CF6",
          "Onsite Zone": "#F59E0B",
          PTO: "#EF4444",
          Home: "#6B7280",
          Office: "#84CC16",
          "Special Projects": "#EC4899",
          "Training/T3": "#F97316",
          Canceled: "#DC2626",
        }[type] || "#6B7280",
    }));
  };

  const exportToExcel = () => {
    const summaryData = performanceData.map((dpc) => ({
      DPC: dpc.name,
      Region: dpc.region,
      "Visits Scheduled": dpc.scheduledVisits,
      "Visits Completed": dpc.approvedVisits,
      "Visit % Achieved": `${dpc.percentage}%`,
      "On-Site Retailer": dpc.onSiteRetailer,
      "On-Site Corporate": dpc.onSiteCorporate,
      Virtual: dpc.virtual,
      "Onsite Zone": dpc.onsiteZone,
      "Training/T3": dpc.training,
      "Special Projects": dpc.specialProjects,
      "Pending Approval": dpc.pendingApproval,
    }));
    const detailedData = filteredVisits.map((visit) => ({
      DPC: visit.dpc,
      "Created By": visit.createdBy,
      Date: visit.date,
      "Visit Type": visit.visitType,
      "Retailer Name": visit.retailerName || "",
      City: visit.city || "",
      State: visit.state || "",
      "Report Received": visitUtils.isVisitApproved(visit) ? "Yes" : "No",
      "Received Date": visit.receivedDate || "",
      Notes: visit.transportation || "",
    }));
    const csvContent = [
      "=== DPC SUMMARY ===",
      Object.keys(summaryData[0] || {}).join(","),
      ...summaryData.map((row) => Object.values(row).join(",")),
      "",
      "=== DETAILED VISITS ===",
      Object.keys(detailedData[0] || {}).join(","),
      ...detailedData.map((row) => Object.values(row).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DPC_Activity_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Mock data for charts
  const mockBarChartData = performanceData.map((dpc) => ({
    name: dpc.name,
    approvedVisits: dpc.approvedVisits,
    target: dpc.target,
  }));

  const visitTypeData = getVisitTypeData();

  return (
    <div className="space-y-6 bg-background">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Report Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Date Range
              </label>
              <Select
                value={reportFilters.dateRange}
                onValueChange={(value) =>
                  setReportFilters({ ...reportFilters, dateRange: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="last3Months">Last 3 Months</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentUser.role === "lead" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">DPC</label>
                  <Select
                    value={reportFilters.dpc}
                    onValueChange={(value) =>
                      setReportFilters({ ...reportFilters, dpc: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select DPC" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All DPCs</SelectItem>
                      {dpcData.map((dpc) => (
                        <SelectItem key={dpc.name} value={dpc.name}>
                          {dpc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Region
                  </label>
                  <Select
                    value={reportFilters.region}
                    onValueChange={(value) =>
                      setReportFilters({ ...reportFilters, region: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {[...new Set(dpcData.map((dpc) => dpc.region))].map(
                        (region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                Visit Type
              </label>
              <Select
                value={reportFilters.visitType}
                onValueChange={(value) =>
                  setReportFilters({ ...reportFilters, visitType: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select visit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="On-Site Retailer">
                    On-Site Retailer
                  </SelectItem>
                  <SelectItem value="On-Site Corporate">
                    On-Site Corporate
                  </SelectItem>
                  <SelectItem value="Virtual">Virtual</SelectItem>
                  <SelectItem value="Onsite Zone">Onsite Zone</SelectItem>
                  <SelectItem value="PTO">PTO</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Special Projects">
                    Special Projects
                  </SelectItem>
                  <SelectItem value="Training/T3">Training/T3</SelectItem>
                  <SelectItem value="Canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={reportFilters.approvalStatus}
                onValueChange={(value) =>
                  setReportFilters({ ...reportFilters, approvalStatus: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredVisits.length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Visits</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredVisits.filter(visitUtils.isVisitApproved).length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {
                    filteredVisits.filter((v) => !visitUtils.isVisitApproved(v))
                      .length
                  }
                </p>
              </div>
              <X className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Goal Achievement</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    performanceData.reduce(
                      (acc, dpc) => acc + dpc.percentage,
                      0,
                    ) / performanceData.length || 0,
                  )}
                  %
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              DPC Performance vs Target
            </h3>
            <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
              {/* Placeholder for BarChart */}
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Bar Chart Visualization</p>
                <p className="text-sm">
                  Performance data for {performanceData.length} DPCs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              Visit Distribution by Type
            </h3>
            <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
              {/* Placeholder for PieChart */}
              <div className="text-center text-gray-500">
                <div className="h-20 w-20 rounded-full bg-blue-100 border-8 border-blue-500 mx-auto mb-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-green-500"></div>
                  <div className="absolute bottom-0 left-0 h-1/3 w-1/2 bg-purple-500"></div>
                </div>
                <p>Pie Chart Visualization</p>
                <p className="text-sm">{visitTypeData.length} visit types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            Detailed Performance Breakdown
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DPC</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Goal %</TableHead>
                  <TableHead>Retailer</TableHead>
                  <TableHead>Corporate</TableHead>
                  <TableHead>Virtual</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Training</TableHead>
                  <TableHead>Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceData.map((dpc) => (
                  <TableRow key={dpc.name} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{dpc.name}</TableCell>
                    <TableCell>{dpc.region}</TableCell>
                    <TableCell>{dpc.scheduledVisits}</TableCell>
                    <TableCell>{dpc.approvedVisits}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dpc.percentage >= 100
                            ? "default"
                            : dpc.percentage >= 75
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          dpc.percentage >= 100
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : dpc.percentage >= 75
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                        }
                      >
                        {dpc.percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>{dpc.onSiteRetailer}</TableCell>
                    <TableCell>{dpc.onSiteCorporate}</TableCell>
                    <TableCell>{dpc.virtual}</TableCell>
                    <TableCell>{dpc.onsiteZone}</TableCell>
                    <TableCell>{dpc.training}</TableCell>
                    <TableCell>
                      {dpc.pendingApproval > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        >
                          {dpc.pendingApproval}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {currentUser.role === "lead" && (
            <div className="mt-8">
              <h4 className="text-md font-semibold mb-3">
                Recent Visit Details
              </h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>DPC</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Visit Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisits.slice(0, 10).map((visit) => (
                      <TableRow
                        key={visit.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedVisit(visit)}
                      >
                        <TableCell>{visit.date}</TableCell>
                        <TableCell className="font-medium">
                          {visit.dpc}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {visit.createdBy}
                        </TableCell>
                        <TableCell>{visit.visitType}</TableCell>
                        <TableCell>
                          {visit.retailerName || visit.visitType}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              visitUtils.isVisitApproved(visit)
                                ? "default"
                                : "outline"
                            }
                            className={
                              visitUtils.isVisitApproved(visit)
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                            }
                          >
                            {visitUtils.isVisitApproved(visit)
                              ? "Report Received"
                              : "Pending Report"}
                          </Badge>
                          {!visitUtils.isVisitApproved(visit) &&
                            visitUtils.isVisitOverdue(visit) && (
                              <Badge
                                variant="destructive"
                                className="ml-2 bg-red-100 text-red-800 hover:bg-red-100"
                              >
                                Overdue
                              </Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-gray-600 max-w-xs truncate">
                          {visit.transportation}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsView;
