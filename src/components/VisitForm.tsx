import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Retailer {
  code: string;
  name: string;
  city: string;
  state: string;
}

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

interface User {
  role: string;
  name: string;
  region: string;
}

interface VisitFormProps {
  visit?: Visit;
  onSave: (visitData: Visit | null, deleteId?: number) => void;
  onCancel: () => void;
  preSelectedDate?: string | null;
  retailers: Retailer[];
  currentUser: User;
}

const visitUtils = {
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
};

const VisitForm: React.FC<VisitFormProps> = ({
  visit,
  onSave,
  onCancel,
  preSelectedDate,
  retailers = [],
  currentUser = { role: "dpc", name: "Default User", region: "Default Region" },
}) => {
  const [formData, setFormData] = useState<Visit>(() => {
    if (visit) return visit;
    const defaultDate =
      preSelectedDate || new Date().toISOString().split("T")[0];
    return {
      id: Date.now(),
      dpc: currentUser.name,
      region: currentUser.region,
      createdBy: currentUser.name,
      date: defaultDate,
      retailerCode: "",
      retailerName: "",
      city: "",
      state: "",
      visitType: "On-Site Retailer",
      approved: false,
      approvalDate: "",
      receivedDate: "",
      transportation: "",
    };
  });

  const [dateError, setDateError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRetailerDropdownOpen, setIsRetailerDropdownOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(
    null,
  );

  const visitTypes = [
    "On-Site Retailer",
    "On-Site Corporate",
    "Virtual",
    "Onsite Zone",
    "PTO",
    "Home",
    "Office",
    "Special Projects",
    "Training/T3",
    "Canceled",
  ];

  const checkWeekendDate = (dateString: string) => {
    const validation = visitUtils.validateVisitDate(dateString);
    setDateError(validation.error);
  };

  const handleDateChange = (newDate: string) => {
    setFormData({ ...formData, date: newDate });
    checkWeekendDate(newDate);
  };

  const handleRetailerSelect = (retailer: Retailer | null) => {
    setSelectedRetailer(retailer);
    if (retailer) {
      setFormData({
        ...formData,
        retailerCode: retailer.code,
        retailerName: retailer.name,
        city: retailer.city,
        state: retailer.state,
      });
    } else {
      setFormData({
        ...formData,
        retailerCode: "",
        retailerName: "",
        city: "",
        state: "",
      });
    }
    setIsRetailerDropdownOpen(false);
  };

  const handleSubmit = () => {
    if (dateError) return;
    const newVisit = {
      ...formData,
      id: visit ? visit.id : Date.now(),
      dpc: currentUser.name,
      region: currentUser.region,
      createdBy: visit ? formData.createdBy : currentUser.name,
    };
    onSave(newVisit);
  };

  const handleDelete = () => {
    if (!visit) return;

    const visitInfo = visit.retailerName || visit.visitType;
    const visitDate = new Date(visit.date).toLocaleDateString();

    if (
      window.confirm(
        `⚠️ WARNING: You are about to permanently delete this visit:\n\nDPC: ${visit.dpc}\nDate: ${visitDate}\nLocation: ${visitInfo}\nType: ${visit.visitType}\n\nThis action CANNOT be undone. Are you sure you want to proceed?`,
      )
    ) {
      onSave(null, visit.id);
    }
  };

  const sortedRetailers = [...retailers].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const filteredRetailers = sortedRetailers.filter(
    (retailer) =>
      retailer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      retailer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${retailer.city}, ${retailer.state}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    if (formData.date) {
      checkWeekendDate(formData.date);
    }
  }, []);

  useEffect(() => {
    if (!visit && preSelectedDate) {
      setFormData((prev) => ({
        ...prev,
        date: preSelectedDate,
      }));
      checkWeekendDate(preSelectedDate);
    }
  }, [preSelectedDate, visit]);

  useEffect(() => {
    if (formData.retailerCode) {
      const retailer = retailers.find((r) => r.code === formData.retailerCode);
      setSelectedRetailer(retailer || null);
    }
  }, [formData.retailerCode, retailers]);

  const showRetailerFields = ![
    "Home",
    "Office",
    "PTO",
    "Special Projects",
    "Training/T3",
  ].includes(formData.visitType);

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>
            {visit ? "Edit Visit" : "Add New Visit"}
            {!visit && formData.date && (
              <span className="text-sm font-normal text-blue-600 block">
                for{" "}
                {new Date(formData.date + "T00:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleDateChange(e.target.value)}
              className={dateError ? "border-red-500" : ""}
            />
            {dateError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{dateError}</AlertDescription>
              </Alert>
            )}
          </div>

          {visit && (
            <div className="space-y-2">
              <Label htmlFor="createdBy">Created By</Label>
              <Input
                id="createdBy"
                value={formData.createdBy || "Unknown"}
                disabled
                className="bg-gray-50"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="visitType">Visit Type</Label>
            <Select
              value={formData.visitType}
              onValueChange={(value) =>
                setFormData({ ...formData, visitType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visit type" />
              </SelectTrigger>
              <SelectContent>
                {visitTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showRetailerFields && (
            <>
              <div className="space-y-2">
                <Label>Select Retailer</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={
                      selectedRetailer
                        ? `${selectedRetailer.code} - ${selectedRetailer.name}`
                        : searchTerm
                    }
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsRetailerDropdownOpen(true);
                      if (!e.target.value) {
                        handleRetailerSelect(null);
                      }
                    }}
                    onFocus={() => setIsRetailerDropdownOpen(true)}
                    placeholder="Search retailers by name, code, or location..."
                    className="pr-10"
                  />
                  {selectedRetailer && (
                    <button
                      type="button"
                      onClick={() => handleRetailerSelect(null)}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setIsRetailerDropdownOpen(!isRetailerDropdownOpen)
                    }
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    <svg
                      className={`h-4 w-4 transform transition-transform ${isRetailerDropdownOpen ? "rotate-180" : ""}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                {isRetailerDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredRetailers.length > 0 ? (
                      filteredRetailers.map((retailer) => (
                        <button
                          key={retailer.code}
                          type="button"
                          onClick={() => handleRetailerSelect(retailer)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-sm">
                            {retailer.code} - {retailer.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {retailer.city}, {retailer.state}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {searchTerm
                          ? "No retailers found matching your search."
                          : "No retailers available."}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="retailerName">
                  Retailer Name (Manual Entry)
                </Label>
                <Input
                  id="retailerName"
                  value={formData.retailerName}
                  onChange={(e) =>
                    setFormData({ ...formData, retailerName: e.target.value })
                  }
                  placeholder="Or enter retailer name manually"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    maxLength={2}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.transportation}
              onChange={(e) =>
                setFormData({ ...formData, transportation: e.target.value })
              }
              placeholder="Enter visit notes or details"
              className="min-h-[80px]"
            />
          </div>

          {currentUser.role === "lead" && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="receivedReport"
                  checked={!!formData.receivedDate}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const today = new Date().toISOString().split("T")[0];
                      setFormData({
                        ...formData,
                        receivedDate: today,
                        approved: true,
                      });
                    } else {
                      setFormData({
                        ...formData,
                        receivedDate: "",
                        approved: false,
                      });
                    }
                  }}
                />
                <Label htmlFor="receivedReport">Visit Report Received</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedDate">Report Received Date</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      receivedDate: e.target.value,
                      approved: !!e.target.value,
                    })
                  }
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!!dateError}
              className={`flex-1 ${dateError ? "bg-gray-400 text-gray-600 cursor-not-allowed" : ""}`}
            >
              {visit ? "Update Visit" : "Add Visit"}
            </Button>

            {visit && currentUser.role === "lead" && (
              <Button onClick={handleDelete} variant="destructive">
                Delete
              </Button>
            )}

            <Button onClick={onCancel} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisitForm;
