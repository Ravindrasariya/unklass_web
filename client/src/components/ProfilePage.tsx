import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface UnifiedStudent {
  id: number;
  name: string;
  fatherName: string;
  location: string;
  mobileNumber: string;
  schoolName?: string | null;
  dateOfBirth?: string | null;
}

interface ProfilePageProps {
  student: UnifiedStudent;
  onBack: () => void;
  onUpdate: (updatedStudent: UnifiedStudent) => void;
}

export default function ProfilePage({ student, onBack, onUpdate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: student.schoolName || "",
    dateOfBirth: student.dateOfBirth || "",
  });
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PATCH", `/api/auth/student/${student.id}`, {
        schoolName: formData.schoolName || null,
        dateOfBirth: formData.dateOfBirth || null,
      });
      
      const updatedStudent = await response.json();
      onUpdate(updatedStudent);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
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
    setFormData({
      schoolName: student.schoolName || "",
      dateOfBirth: student.dateOfBirth || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-gray-600"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card>
          <CardHeader className="text-center pb-4">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-sky-600" />
            </div>
            <CardTitle className="text-2xl">{student.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <p className="font-medium" data-testid="text-name">{student.name}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <Label className="text-xs text-gray-500">Father's Name</Label>
                  <p className="font-medium" data-testid="text-father-name">{student.fatherName}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <Label className="text-xs text-gray-500">Mobile Number</Label>
                  <p className="font-medium" data-testid="text-mobile">{student.mobileNumber}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <Label className="text-xs text-gray-500">Location</Label>
                  <p className="font-medium" data-testid="text-location">{student.location}</p>
                </div>
              </div>

              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="schoolName" className="text-xs text-gray-500">School Name</Label>
                    <Input
                      id="schoolName"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      placeholder="Enter your school name"
                      data-testid="input-school-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-xs text-gray-500">Date of Birth</Label>
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
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                      data-testid="button-cancel"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <Label className="text-xs text-gray-500">School Name</Label>
                      <p className="font-medium" data-testid="text-school-name">
                        {student.schoolName || <span className="text-gray-400 italic">Not provided</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <Label className="text-xs text-gray-500">Date of Birth</Label>
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
