import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Edit2, Save, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UnifiedStudent {
  id: number;
  name: string;
  fatherName: string | null;
  location: string | null;
  mobileNumber: string;
  schoolName?: string | null;
  dateOfBirth?: string | null;
  needsProfileCompletion?: boolean;
}

interface ProfilePageProps {
  student: UnifiedStudent;
  onBack: () => void;
  onUpdate: (updatedStudent: UnifiedStudent) => void;
}

export default function ProfilePage({ student, onBack, onUpdate }: ProfilePageProps) {
  const needsProfileCompletion = !student.fatherName || !student.location;
  const [isEditing, setIsEditing] = useState(needsProfileCompletion);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fatherName: student.fatherName || "",
    location: student.location || "",
    schoolName: student.schoolName || "",
    dateOfBirth: student.dateOfBirth || "",
  });
  const { toast } = useToast();

  const handleSave = async () => {
    if (needsProfileCompletion && (!formData.fatherName.trim() || !formData.location.trim())) {
      toast({
        title: "Required Fields",
        description: "Please fill in Father's Name and Location to complete your profile.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatePayload: Record<string, string | null> = {
        schoolName: formData.schoolName || null,
        dateOfBirth: formData.dateOfBirth || null,
      };
      
      if (!student.fatherName && formData.fatherName.trim()) {
        updatePayload.fatherName = formData.fatherName.trim();
      }
      if (!student.location && formData.location.trim()) {
        updatePayload.location = formData.location.trim();
      }

      const response = await apiRequest("PATCH", `/api/auth/student/${student.id}`, updatePayload);
      
      const updatedStudent = await response.json();
      onUpdate(updatedStudent);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: needsProfileCompletion 
          ? "Your profile has been completed successfully."
          : "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (needsProfileCompletion) {
      return;
    }
    setFormData({
      fatherName: student.fatherName || "",
      location: student.location || "",
      schoolName: student.schoolName || "",
      dateOfBirth: student.dateOfBirth || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-gray-600 dark:text-gray-400"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {needsProfileCompletion && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Complete Your Profile</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Please provide your Father's Name and Location to complete your profile.
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 bg-sky-100 dark:bg-sky-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-sky-600 dark:text-sky-400" />
            </div>
            <CardTitle className="text-2xl">{student.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Name</Label>
                  <p className="font-medium" data-testid="text-name">{student.name}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Mobile Number</Label>
                  <p className="font-medium" data-testid="text-mobile">{student.mobileNumber}</p>
                </div>
              </div>

              {isEditing ? (
                <>
                  {!student.fatherName && (
                    <div className="space-y-2">
                      <Label htmlFor="fatherName" className="text-xs text-gray-500 dark:text-gray-400">
                        Father's Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fatherName"
                        value={formData.fatherName}
                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                        placeholder="Enter your father's name"
                        data-testid="input-father-name"
                        required
                      />
                    </div>
                  )}

                  {!student.location && (
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-xs text-gray-500 dark:text-gray-400">
                        Location <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Enter your city/location"
                        data-testid="input-location"
                        required
                      />
                    </div>
                  )}

                  {student.fatherName && (
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">Father's Name</Label>
                        <p className="font-medium" data-testid="text-father-name">{student.fatherName}</p>
                      </div>
                    </div>
                  )}

                  {student.location && (
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <Label className="text-xs text-gray-500 dark:text-gray-400">Location</Label>
                        <p className="font-medium" data-testid="text-location">{student.location}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="schoolName" className="text-xs text-gray-500 dark:text-gray-400">School Name</Label>
                    <Input
                      id="schoolName"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      placeholder="Enter your school name"
                      data-testid="input-school-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      data-testid="input-dob"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex-1"
                      data-testid="button-save"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? "Saving..." : needsProfileCompletion ? "Complete Profile" : "Save Changes"}
                    </Button>
                    {!needsProfileCompletion && (
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                        data-testid="button-cancel"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Father's Name</Label>
                      <p className="font-medium" data-testid="text-father-name">
                        {student.fatherName || <span className="text-gray-400 italic">Not provided</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Location</Label>
                      <p className="font-medium" data-testid="text-location">
                        {student.location || <span className="text-gray-400 italic">Not provided</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">School Name</Label>
                      <p className="font-medium" data-testid="text-school-name">
                        {student.schoolName || <span className="text-gray-400 italic">Not provided</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</Label>
                      <p className="font-medium" data-testid="text-dob">
                        {student.dateOfBirth ? (
                          new Date(student.dateOfBirth).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        ) : (
                          <span className="text-gray-400 italic">Not provided</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="w-full mt-4"
                    data-testid="button-edit"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
