import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, FileText, Trash2, AlertCircle, CheckCircle2, Eye, Lock, LogOut, Users, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

const VALID_GRADES = ["8th", "10th", "12th"];
const VALID_BOARDS = ["MP", "CBSE"];
const VALID_SUBJECTS = ["Mathematics", "Science", "SST", "Hindi", "English", "Physics", "Chemistry", "Biology"];

interface Pdf {
  id: number;
  filename: string;
  grade: string;
  board: string;
  subject: string;
  createdAt: string;
}

interface PdfPreview {
  id: number;
  filename: string;
  grade: string;
  board: string;
  subject: string;
  content: string;
  contentLength: number;
}

interface StudentSession {
  id: number;
  subject: string;
  score: number | null;
  totalQuestions: number | null;
  completedAt: string | null;
}

interface StudentProgress {
  id: number;
  name: string;
  grade: string;
  board: string;
  location: string;
  mobileNumber: string;
  totalQuizzes: number;
  averageScore: number;
  subjectsAttempted: string[];
  sessions: StudentSession[];
}

export default function AdminPage() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<PdfPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);
    
    try {
      const response = await apiRequest("POST", "/api/admin/login", { password });
      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        setPassword("");
      } else {
        setAuthError("Incorrect password");
      }
    } catch (error) {
      setAuthError("Authentication failed. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
  };

  const { data: pdfs, isLoading } = useQuery<Pdf[]>({
    queryKey: ["/api/admin/pdfs"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<StudentProgress[]>({
    queryKey: ["/api/admin/students"],
    enabled: isAuthenticated,
  });

  const handleToggleStudent = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (students && selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else if (students) {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleDownloadCSV = (studentIds?: number[]) => {
    const params = studentIds && studentIds.length > 0 
      ? `?studentIds=${studentIds.join(",")}`
      : "";
    window.open(`/api/admin/students/csv${params}`, "_blank");
  };

  const handlePreview = async (pdfId: number) => {
    setPreviewLoading(true);
    try {
      const response = await apiRequest("GET", `/api/admin/pdfs/${pdfId}`);
      const data = await response.json();
      setPreviewPdf(data);
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: "Could not load PDF preview.",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("pdf", file);
      
      const response = await apiRequest("POST", "/api/admin/upload-pdf", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "PDF Uploaded",
        description: "The PDF has been uploaded successfully and is ready for quiz generation.",
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdfs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/pdfs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "PDF Deleted",
        description: "The PDF has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdfs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a PDF file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const validateFilename = (filename: string): { isValid: boolean; error?: string } => {
    const match = filename.match(/^(.+)_(.+)_(.+)\.pdf$/i);
    if (!match) {
      return { isValid: false, error: "Format must be: grade_board_subject.pdf" };
    }
    
    const [, grade, board, subject] = match;
    
    if (!VALID_GRADES.includes(grade)) {
      return { isValid: false, error: `Invalid grade "${grade}". Use: ${VALID_GRADES.join(", ")}` };
    }
    if (!VALID_BOARDS.includes(board.toUpperCase())) {
      return { isValid: false, error: `Invalid board "${board}". Use: ${VALID_BOARDS.join(", ")}` };
    }
    if (!VALID_SUBJECTS.includes(subject)) {
      return { isValid: false, error: `Invalid subject "${subject}". Use: ${VALID_SUBJECTS.join(", ")}` };
    }
    
    return { isValid: true };
  };

  const filenameValidation = selectedFile ? validateFilename(selectedFile.name) : { isValid: true };
  const isValidFilename = filenameValidation.isValid;

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>
              Enter the admin password to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-admin-password"
                />
                {authError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {authError}
                  </p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={!password || isAuthenticating}
                data-testid="button-admin-login"
              >
                {isAuthenticating ? "Verifying..." : "Access Dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage PDF study materials for quiz generation
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload PDF
            </CardTitle>
            <CardDescription>
              Upload PDF files with the naming format: <code className="bg-muted px-1 py-0.5 rounded text-sm">grade_board_subject.pdf</code>
              <br />
              Examples: <code className="bg-muted px-1 py-0.5 rounded text-sm">10th_MP_Mathematics.pdf</code>, <code className="bg-muted px-1 py-0.5 rounded text-sm">12th_CBSE_Physics.pdf</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              data-testid="dropzone-pdf"
            >
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                Drag and drop a PDF file here, or click to select
              </p>
              <Label htmlFor="pdf-upload" className="cursor-pointer">
                <Input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-pdf-file"
                />
                <Button variant="outline" type="button" asChild>
                  <span>Select PDF</span>
                </Button>
              </Label>
            </div>

            {selectedFile && (
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  isValidFilename ? "bg-muted" : "bg-destructive/10"
                }`}>
                  <FileText className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" data-testid="text-selected-filename">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {isValidFilename ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                </div>

                {!isValidFilename && filenameValidation.error && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {filenameValidation.error}
                  </p>
                )}

                <Button 
                  onClick={handleUpload}
                  disabled={!isValidFilename || uploadMutation.isPending}
                  className="w-full"
                  data-testid="button-upload-pdf"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload PDF"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded PDFs
            </CardTitle>
            <CardDescription>
              These PDFs are used to generate quiz questions for students
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : !pdfs || pdfs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No PDFs uploaded yet. Upload your first PDF above.
              </p>
            ) : (
              <div className="space-y-3">
                {pdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                    data-testid={`pdf-item-${pdf.id}`}
                  >
                    <FileText className="h-5 w-5 flex-shrink-0 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pdf.filename}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {pdf.grade}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {pdf.board}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {pdf.subject}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(pdf.id)}
                        disabled={previewLoading}
                        data-testid={`button-preview-pdf-${pdf.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(pdf.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-pdf-${pdf.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Progress
                </CardTitle>
                <CardDescription>
                  View student performance and download progress reports
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadCSV(selectedStudents)}
                  disabled={selectedStudents.length === 0}
                  data-testid="button-download-selected-csv"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Selected ({selectedStudents.length})
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleDownloadCSV()}
                  data-testid="button-download-all-csv"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading students...</p>
            ) : !students || students.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No students registered yet.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Checkbox
                    checked={students.length > 0 && selectedStudents.length === students.length}
                    onCheckedChange={handleSelectAllStudents}
                    data-testid="checkbox-select-all-students"
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all ({students.length} students)
                  </span>
                </div>
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="border rounded-lg overflow-hidden"
                      data-testid={`student-row-${student.id}`}
                    >
                      <div 
                        className="flex items-center gap-3 p-3 bg-muted/50 cursor-pointer"
                        onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                      >
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => handleToggleStudent(student.id)}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`checkbox-student-${student.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{student.name}</p>
                            <Badge variant="secondary" className="text-xs">{student.grade}</Badge>
                            <Badge variant="secondary" className="text-xs">{student.board}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{student.mobileNumber}</p>
                        </div>
                        <div className="text-right mr-2">
                          <p className="font-medium">{student.totalQuizzes} quizzes</p>
                          <p className="text-sm text-muted-foreground">
                            {student.averageScore}% avg
                          </p>
                        </div>
                        {expandedStudent === student.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {expandedStudent === student.id && (
                        <div className="p-3 border-t bg-background">
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">Location:</span> {student.location}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Subjects:</span>{" "}
                              {student.subjectsAttempted.length > 0 
                                ? student.subjectsAttempted.join(", ")
                                : "None yet"}
                            </div>
                          </div>
                          {student.sessions.length > 0 ? (
                            <div className="space-y-1">
                              <p className="text-sm font-medium mb-2">Quiz History:</p>
                              {student.sessions.map((session) => (
                                <div 
                                  key={session.id}
                                  className="flex items-center justify-between text-sm p-2 bg-muted rounded"
                                >
                                  <span>{session.subject}</span>
                                  <div className="flex items-center gap-4">
                                    <span>
                                      {session.score}/{session.totalQuestions} 
                                      ({session.totalQuestions ? Math.round((session.score || 0) / session.totalQuestions * 100) : 0}%)
                                    </span>
                                    <span className="text-muted-foreground">
                                      {session.completedAt 
                                        ? new Date(session.completedAt).toLocaleDateString("en-IN")
                                        : "In progress"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No quizzes completed yet.</p>
                          )}
                          <div className="mt-3 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadCSV([student.id])}
                              data-testid={`button-download-student-${student.id}`}
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Download Report
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!previewPdf} onOpenChange={(open) => !open && setPreviewPdf(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewPdf?.filename}
            </DialogTitle>
            <DialogDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{previewPdf?.grade}</Badge>
                <Badge variant="secondary">{previewPdf?.board}</Badge>
                <Badge variant="secondary">{previewPdf?.subject}</Badge>
                <Badge variant="outline">{previewPdf?.contentLength.toLocaleString()} characters</Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[50vh] mt-4">
            <div className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg">
              {previewPdf?.content}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
