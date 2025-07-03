import React, { useState, useEffect } from "react";
import { Calendar, BarChart3, Plus } from "lucide-react";
import CalendarView from "./CalendarView";
import ReportsView from "./ReportsView";
import VisitForm from "./VisitForm";
import DashboardLayout from "./DashboardLayout";

// Mock data for retailers and visits
const mockData = {
  fetchRetailers: () => [
    {
      code: "403872",
      name: "Mid-Hudson Subaru",
      city: "Wappingers Falls",
      state: "NY",
    },
    { code: "20226", name: "Brewster Subaru", city: "Brewster", state: "NY" },
    {
      code: "20211",
      name: "Koeppel Subaru",
      city: "Long Island City",
      state: "NY",
    },
    { code: "20273", name: "Lynnes Subaru", city: "Bloomfield", state: "NJ" },
    { code: "20235", name: "Open Road Subaru", city: "Union", state: "NJ" },
    // Additional retailers would be here
  ],
  fetchVisits: () => [
    {
      id: 1,
      dpc: "Salamone, D",
      region: "SDC 1",
      createdBy: "Salamone, D",
      date: "2025-06-05",
      retailerCode: "403872",
      retailerName: "Mid-Hudson Subaru",
      city: "Wappingers Falls",
      state: "NY",
      visitType: "On-Site Retailer",
      approved: true,
      approvalDate: "2025-06-05",
      receivedDate: "2025-06-05",
      transportation: "Great visit, strong team engagement",
    },
    // Additional visits would be here
  ],
  fetchDPCData: () => [
    { name: "Salamone, D", region: "SDC 1", target: 20 },
    { name: "Manno, D", region: "SDC 2", target: 20 },
    { name: "Gillman, T", region: "PHL 1", target: 20 },
    // Additional DPC data would be here
  ],
};

// Visit utility functions
const visitUtils = {
  isVisitApproved: (visit: any) =>
    !!(visit.receivedDate && visit.receivedDate.trim()),
  validateVisitDate: (dateString: string) => {
    if (!dateString) return { isValid: true, error: "" };
    const date = new Date(dateString + "T00:00:00");
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        isValid: false,
        error: "Visits cannot be scheduled on weekends (Saturday or Sunday)",
      };
    }
    return { isValid: true, error: "" };
  },
  isVisitOverdue: (visit: any) => {
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

// Local storage hook for visits
function useLocalVisits(storageKey: string, defaultVisits: any[]) {
  const [visits, setVisits] = useState(() => {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : defaultVisits;
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(visits));
  }, [storageKey, visits]);

  return [visits, setVisits] as const;
}

// Summary Stats Component
function SummaryStats({
  visits,
  currentUser,
  showVisitsLeft = true,
}: {
  visits: any[];
  currentUser: any;
  showVisitsLeft?: boolean;
}) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const requiredVisits = 20;

  const monthlyVisits = visits.filter((visit) => {
    const visitDate = new Date(visit.date);
    const isCurrentMonth =
      visitDate.getMonth() === currentMonth &&
      visitDate.getFullYear() === currentYear;
    if (currentUser.role === "dpc") {
      return isCurrentMonth && visit.dpc === currentUser.name;
    }
    return isCurrentMonth;
  });

  const scheduledVisitTypes = [
    "On-Site Retailer",
    "On-Site Corporate",
    "Virtual",
    "Onsite Zone",
  ];

  const scheduledVisits = monthlyVisits.filter((visit) =>
    scheduledVisitTypes.includes(visit.visitType),
  );

  const completedVisits = monthlyVisits.filter(
    (visit) => !!(visit.receivedDate && visit.receivedDate.trim()),
  );

  const completionPercentage = Math.round(
    (completedVisits.length / requiredVisits) * 100,
  );

  const visitsLeft = Math.max(requiredVisits - completedVisits.length, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {currentUser.role === "dpc" ? "My " : ""}Monthly Summary
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {scheduledVisits.length}
          </div>
          <div className="text-sm text-gray-600">Visits Scheduled</div>
          <div className="text-xs text-gray-500 mt-1">
            Retailer, Corporate, Virtual, Zone
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {completedVisits.length}
          </div>
          <div className="text-sm text-gray-600">Visits Completed</div>
          <div className="text-xs text-gray-500 mt-1">Report Received</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {completionPercentage}%
          </div>
          <div className="text-sm text-gray-600">Goal Achieved</div>
          <div className="text-xs text-gray-500 mt-1">
            Target: {requiredVisits}/month
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {
              monthlyVisits.filter(
                (v) => !(v.receivedDate && v.receivedDate.trim()),
              ).length
            }
          </div>
          <div className="text-sm text-gray-600">Pending Approval</div>
          <div className="text-xs text-gray-500 mt-1">Awaiting report</div>
        </div>
        {showVisitsLeft && (
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{visitsLeft}</div>
            <div className="text-sm text-gray-600">Visits Left</div>
            <div className="text-xs text-gray-500 mt-1">To Target</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Toast notification component
function Toasts({
  toasts,
  onClose,
}: {
  toasts: any[];
  onClose: (index: number) => void;
}) {
  return (
    <div className="fixed z-50 bottom-4 right-4 space-y-2">
      {toasts.map((toast, i) => (
        <div
          key={i}
          className="flex items-center bg-white border rounded shadow px-4 py-3 min-w-[200px]"
        >
          {toast.type === "error" && (
            <div className="text-red-600 mr-2">⚠️</div>
          )}
          {toast.type === "success" && (
            <div className="text-green-600 mr-2">✓</div>
          )}
          {toast.type === "info" && (
            <div className="text-blue-600 mr-2">ℹ️</div>
          )}
          <div className="flex-1 text-sm">{toast.message}</div>
          <button
            className="ml-2 text-gray-500 hover:text-gray-800"
            onClick={() => onClose(i)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// Main component
export default function Home() {
  // Demo: current user
  const [currentUser, setCurrentUser] = useState({
    role: "dpc",
    name: "Salamone, D",
    region: "SDC 1",
  });

  const [currentView, setCurrentView] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [retailers] = useState(mockData.fetchRetailers());
  const [dpcData] = useState(mockData.fetchDPCData());

  // Visits with persistent storage
  const [visits, setVisits] = useLocalVisits(
    "dpc_visits",
    mockData.fetchVisits(),
  );

  // Visit form / modal state
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [preSelectedDate, setPreSelectedDate] = useState<string | null>(null);

  // Reporting state
  const [reportFilters, setReportFilters] = useState({
    dateRange: "thisMonth",
    dpc: "all",
    region: "all",
    visitType: "all",
    approvalStatus: "all",
  });

  // Toast notifications
  const [toasts, setToasts] = useState<
    Array<{ message: string; type: string }>
  >([]);

  const addToast = (message: string, type = "info") => {
    setToasts((prev) => [...prev, { message, type }]);
    setTimeout(() => setToasts((prev) => prev.slice(1)), 4000);
  };

  // Calendar: Click a day to open new visit modal
  const handleDayClick = (dateString: string) => {
    setPreSelectedDate(dateString);
    setShowAddVisit(true);
  };

  // Save or delete a visit
  const handleVisitSave = (visitData: any, deleteId?: number) => {
    if (deleteId) {
      setVisits(visits.filter((v) => v.id !== deleteId));
      addToast("Visit deleted.", "success");
    } else if (visitData) {
      if (visitData.id && visits.find((v) => v.id === visitData.id)) {
        setVisits(visits.map((v) => (v.id === visitData.id ? visitData : v)));
        addToast("Visit updated!", "success");
      } else {
        setVisits([...visits, visitData]);
        addToast("Visit added!", "success");
      }
    }
    setShowAddVisit(false);
    setSelectedVisit(null);
    setPreSelectedDate(null);
  };

  // Switch user (for demo purposes)
  const switchUser = (role: string, name: string, region: string) => {
    setCurrentUser({ role, name, region });
    addToast(
      `Switched to ${name} (${role === "lead" ? "Lead" : "DPC"})`,
      "info",
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toasts
        toasts={toasts}
        onClose={(idx) => setToasts(toasts.filter((_, i) => i !== idx))}
      />

      <DashboardLayout
        currentUser={currentUser}
        currentView={currentView}
        setCurrentView={setCurrentView}
        setShowAddVisit={setShowAddVisit}
        switchUser={switchUser}
      >
        {/* Summary Stats */}
        <SummaryStats
          visits={visits}
          currentUser={currentUser}
          showVisitsLeft={true}
        />

        {/* Main Content Views */}
        {currentView === "calendar" && (
          <CalendarView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            visits={visits}
            currentUser={currentUser}
            onDayClick={handleDayClick}
            setSelectedVisit={setSelectedVisit}
          />
        )}

        {currentView === "reports" && (
          <ReportsView
            visits={visits}
            dpcData={dpcData}
            currentUser={currentUser}
            reportFilters={reportFilters}
            setReportFilters={setReportFilters}
            setSelectedVisit={setSelectedVisit}
          />
        )}

        {/* Visit Form Modal */}
        {(showAddVisit || selectedVisit) && (
          <VisitForm
            visit={selectedVisit}
            onSave={handleVisitSave}
            onCancel={() => {
              setShowAddVisit(false);
              setSelectedVisit(null);
              setPreSelectedDate(null);
            }}
            preSelectedDate={preSelectedDate}
            retailers={retailers}
            currentUser={currentUser}
          />
        )}
      </DashboardLayout>
    </div>
  );
}
