import React, { useState } from "react";
import { Calendar, BarChart3, Plus, Menu } from "lucide-react";
import CalendarView from "./CalendarView";
import ReportsView from "./ReportsView";
import VisitForm from "./VisitForm";
import { Toggle } from "./ui/toggle";

interface DashboardLayoutProps {
  currentUser?: {
    role: string;
    name: string;
    region: string;
  };
  visits?: any[];
  retailers?: any[];
  dpcData?: any[];
  onVisitSave?: (visitData: any, deleteId?: number) => void;
  onAddToast?: (message: string, type: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentUser = {
    role: "dpc",
    name: "Salamone, D",
    region: "SDC 1",
  },
  visits = [],
  retailers = [],
  dpcData = [],
  onVisitSave = () => {},
  onAddToast = () => {},
}) => {
  const [currentView, setCurrentView] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [calendarViewType, setCalendarViewType] = useState("month");
  const [reportFilters, setReportFilters] = useState({
    dateRange: "thisMonth",
    dpc: "all",
    region: "all",
    visitType: "all",
    approvalStatus: "all",
  });

  // Demo user switching (shows lead and DPCs)
  const switchUser = (role: string, name: string, region: string) => {
    // This would typically update the user context or state in a parent component
    console.log(`Switched to ${name} (${role})`);
    setShowMobileMenu(false);
    onAddToast(
      `Switched to ${name} (${role === "lead" ? "Lead" : "DPC"})`,
      "info",
    );
  };

  // Calendar: Click a day to open new visit modal
  const handleDayClick = (dateString: string) => setShowAddVisit(dateString);

  // Handle visit save or delete
  const handleVisitSave = (visitData: any, deleteId?: number) => {
    onVisitSave(visitData, deleteId);
    setShowAddVisit(false);
    setSelectedVisit(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                DPC Activity Log
              </h1>
              <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {currentUser.name} - {currentUser.region}
              </div>
            </div>
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-8">
              <div className="text-sm text-gray-600">
                {currentUser.name} ({currentUser.region}) -{" "}
                {currentUser.role === "lead" ? "Lead" : "DPC"}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setCurrentView("calendar")}
                    className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      currentView === "calendar"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </button>
                  <button
                    onClick={() => setCurrentView("reports")}
                    className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      currentView === "reports"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Reports
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddVisit(true)}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Visit
                  </button>
                </div>
              </div>
            </nav>
            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          {/* Mobile menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t py-4">
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  {currentUser.name} ({currentUser.region}) -{" "}
                  {currentUser.role === "lead" ? "Lead" : "DPC"}
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => {
                        setCurrentView("calendar");
                        setShowMobileMenu(false);
                      }}
                      className={`flex-1 flex items-center justify-center px-3 py-2 text-sm rounded-md transition-colors ${
                        currentView === "calendar"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600"
                      }`}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Calendar
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView("reports");
                        setShowMobileMenu(false);
                      }}
                      className={`flex-1 flex items-center justify-center px-3 py-2 text-sm rounded-md transition-colors ${
                        currentView === "reports"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600"
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Reports
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddVisit(true);
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Visit
                  </button>
                </div>
                {/* Demo user switching */}
                <div className="border-t pt-4">
                  <div className="text-xs text-gray-500 mb-2">
                    Demo: Switch User
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => switchUser("dpc", "Salamone, D", "SDC 1")}
                      className={`block w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                        currentUser.role === "dpc" &&
                        currentUser.name === "Salamone, D"
                          ? "bg-blue-100 text-blue-800"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Salamone, D (DPC - SDC 1)
                    </button>
                    <button
                      onClick={() => switchUser("dpc", "Gillman, T", "PHL 1")}
                      className={`block w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                        currentUser.role === "dpc" &&
                        currentUser.name === "Gillman, T"
                          ? "bg-blue-100 text-blue-800"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Gillman, T (DPC - PHL 1)
                    </button>
                    <button
                      onClick={() => switchUser("dpc", "Manno, D", "SDC 2")}
                      className={`block w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                        currentUser.role === "dpc" &&
                        currentUser.name === "Manno, D"
                          ? "bg-blue-100 text-blue-800"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Manno, D (DPC - SDC 2)
                    </button>
                    <button
                      onClick={() =>
                        switchUser("lead", "Manager", "All Regions")
                      }
                      className={`block w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                        currentUser.role === "lead"
                          ? "bg-blue-100 text-blue-800"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Manager (Lead)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo user switching for desktop */}
        <div className="hidden md:block mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-700 mb-2">
            Demo Mode - Switch User:
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => switchUser("dpc", "Salamone, D", "SDC 1")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                currentUser.role === "dpc" && currentUser.name === "Salamone, D"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
              }`}
            >
              Salamone, D (DPC)
            </button>
            <button
              onClick={() => switchUser("dpc", "Gillman, T", "PHL 1")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                currentUser.role === "dpc" && currentUser.name === "Gillman, T"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
              }`}
            >
              Gillman, T (DPC)
            </button>
            <button
              onClick={() => switchUser("dpc", "Manno, D", "SDC 2")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                currentUser.role === "dpc" && currentUser.name === "Manno, D"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
              }`}
            >
              Manno, D (DPC)
            </button>
            <button
              onClick={() => switchUser("lead", "Manager", "All Regions")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                currentUser.role === "lead"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
              }`}
            >
              Manager (Lead)
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {currentUser.role === "dpc" ? "My " : ""}Monthly Summary
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Visits Scheduled</div>
              <div className="text-xs text-gray-500 mt-1">
                Retailer, Corporate, Virtual, Zone
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">Visits Completed</div>
              <div className="text-xs text-gray-500 mt-1">Report Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">0%</div>
              <div className="text-sm text-gray-600">Goal Achieved</div>
              <div className="text-xs text-gray-500 mt-1">Target: 20/month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-600">Pending Approval</div>
              <div className="text-xs text-gray-500 mt-1">Awaiting report</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">20</div>
              <div className="text-sm text-gray-600">Visits Left</div>
              <div className="text-xs text-gray-500 mt-1">To Target</div>
            </div>
          </div>
        </div>

        {/* Main Content Views */}
        {currentView === "calendar" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Calendar View</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Month</span>
                  <Toggle
                    pressed={calendarViewType === "week"}
                    onPressedChange={(pressed) =>
                      setCalendarViewType(pressed ? "week" : "month")
                    }
                    className="data-[state=on]:bg-blue-600 data-[state=on]:text-white"
                  />
                  <span className="text-sm text-gray-600">Week</span>
                </div>
              </div>
            </div>
            <CalendarView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              visits={visits}
              currentUser={currentUser}
              onDayClick={handleDayClick}
              setSelectedVisit={setSelectedVisit}
              viewType={calendarViewType}
            />
          </div>
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
      </main>

      {/* Visit Form Modal */}
      {(showAddVisit || selectedVisit) && (
        <VisitForm
          visit={selectedVisit}
          onSave={handleVisitSave}
          onCancel={() => {
            setShowAddVisit(false);
            setSelectedVisit(null);
          }}
          preSelectedDate={
            typeof showAddVisit === "string" ? showAddVisit : undefined
          }
          retailers={retailers}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
