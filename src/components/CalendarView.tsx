import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

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

interface CalendarViewProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  visits: Visit[];
  currentUser: {
    role: string;
    name: string;
    region: string;
  };
  onDayClick: (dateString: string) => void;
  setSelectedVisit: (visit: Visit | null) => void;
  viewType?: "month" | "week";
}

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate = new Date(),
  setSelectedDate = () => {},
  visits = [],
  currentUser = { role: "dpc", name: "Default User", region: "Default Region" },
  onDayClick = () => {},
  setSelectedVisit = () => {},
  viewType = "month",
}) => {
  const today = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // Calculate calendar days based on view type
  const calendarDays = [];
  let startDate: Date;
  let endDate: Date;

  if (viewType === "week") {
    // Week view: show 7 days starting from the selected week
    const dayOfWeek = selectedDate.getDay();
    startDate = new Date(selectedDate);
    startDate.setDate(selectedDate.getDate() - dayOfWeek);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      calendarDays.push({
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        date: date,
      });
    }
  } else {
    // Month view: existing logic
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // Fill in the days of the month
    for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push({
        day: day,
        month: currentMonth,
        year: currentYear,
        date: new Date(currentYear, currentMonth, day),
      });
    }
  }

  const getVisitsForDate = (dayObj: any) => {
    if (!dayObj || !dayObj.day) return [];
    return visits.filter((visit) => {
      const visitDate = parseLocalDate(visit.date);
      return (
        visitDate.getFullYear() === dayObj.year &&
        visitDate.getMonth() === dayObj.month &&
        visitDate.getDate() === dayObj.day &&
        (currentUser.role !== "dpc" || visit.dpc === currentUser.name)
      );
    });
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    if (viewType === "week") {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setSelectedDate(newDate);
  };

  const handleDayClick = (dayObj: any) => {
    if (!dayObj || !dayObj.day) return;
    const clickedDate = `${dayObj.year}-${String(dayObj.month + 1).padStart(
      2,
      "0",
    )}-${String(dayObj.day).padStart(2, "0")}`;

    // Check if the day is a weekend
    const dayOfWeek = dayObj.date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      alert("Visits cannot be scheduled on weekends (Saturday or Sunday)");
      return;
    }

    onDayClick(clickedDate);
  };

  const isVisitApproved = (visit: Visit) => {
    return !!(visit.receivedDate && visit.receivedDate.trim());
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">
            {viewType === "week"
              ? `Week of ${startDate?.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`
              : selectedDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Click on any weekday to add a new visit (weekends disabled)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigateMonth(-1)}
            variant="ghost"
            size="icon"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setSelectedDate(new Date())}
            variant="default"
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Today
          </Button>
          <Button
            onClick={() => navigateMonth(1)}
            variant="ghost"
            size="icon"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>
      <div
        className={`grid gap-1 ${viewType === "week" ? "grid-cols-7" : "grid-cols-7"}`}
      >
        {calendarDays.map((dayObj, index) => {
          const dayVisits = getVisitsForDate(dayObj);
          const isToday =
            dayObj &&
            dayObj.date &&
            dayObj.day === today.getDate() &&
            dayObj.month === today.getMonth() &&
            dayObj.year === today.getFullYear();
          return (
            <div
              key={index}
              className={`${viewType === "week" ? "min-h-[120px]" : "min-h-[80px]"} p-1 border border-gray-100 ${
                dayObj
                  ? (() => {
                      const dayOfWeek = dayObj.date.getDay();
                      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                      if (isWeekend)
                        return "bg-gray-50 text-gray-400 cursor-not-allowed";
                      else return "hover:bg-gray-50 cursor-pointer";
                    })()
                  : ""
              } ${isToday ? "bg-blue-50 border-blue-200" : ""}`}
              onClick={() => dayObj && handleDayClick(dayObj)}
            >
              {dayObj && (
                <>
                  <div
                    className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}
                  >
                    {viewType === "week" ? (
                      <div>
                        <div className="text-xs text-gray-500">
                          {dayObj.date.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </div>
                        <div>{dayObj.day}</div>
                      </div>
                    ) : (
                      dayObj.day
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayVisits
                      .slice(0, viewType === "week" ? 3 : 2)
                      .map((visit) => (
                        <div
                          key={visit.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVisit(visit);
                          }}
                          className={`text-xs p-1 rounded truncate cursor-pointer ${
                            isVisitApproved(visit)
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {[
                            "Home",
                            "Office",
                            "PTO",
                            "Special Projects",
                            "Training/T3",
                          ].includes(visit.visitType)
                            ? visit.visitType
                            : visit.retailerName || visit.visitType}
                        </div>
                      ))}
                    {dayVisits.length > (viewType === "week" ? 3 : 2) && (
                      <div className="text-xs text-gray-500 p-1">
                        +{dayVisits.length - (viewType === "week" ? 3 : 2)} more
                      </div>
                    )}
                    {dayVisits.length === 0 &&
                      (() => {
                        const isWeekend =
                          dayObj.date.getDay() === 0 ||
                          dayObj.date.getDay() === 6;
                        return (
                          !isWeekend && (
                            <div className="text-xs text-gray-400 p-1 text-center opacity-0 hover:opacity-100 transition-opacity">
                              Click to add visit
                            </div>
                          )
                        );
                      })()}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
