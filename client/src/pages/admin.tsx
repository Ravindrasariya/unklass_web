import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, FileText, Trash2, AlertCircle, CheckCircle2, Eye, Lock, LogOut, Users, Download, ChevronDown, ChevronUp, MessageSquare, TrendingUp, Phone, Pencil, RotateCcw, Archive, Bell, Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

const VALID_GRADES = ["8th", "10th"];
const VALID_BOARDS = ["MP", "CBSE"];
const VALID_SUBJECTS = ["Mathematics", "Science", "SST", "Hindi", "English"];
// Chapter Practice uses grades 6th-10th
const CHAPTER_PRACTICE_GRADES = ["6th", "7th", "8th", "9th", "10th"];

interface Pdf {
  id: number;
  filename: string;
  grade: string;
  board: string;
  subject: string;
  createdAt: string;
  isArchived?: boolean;
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

interface ContactSubmission {
  id: number;
  name: string;
  contactNumber: string;
  createdAt: string;
}

interface CpctStudentSession {
  id: number;
  score: number | null;
  totalQuestions: number | null;
  completedAt: string | null;
}

interface CpctStudentProgress {
  id: number;
  name: string;
  medium: string;
  location: string;
  mobileNumber: string;
  totalQuizzes: number;
  averageScore: number;
  sessions: CpctStudentSession[];
}

interface NavodayaStudentSession {
  id: number;
  examGrade: string;
  score: number | null;
  totalQuestions: number | null;
  completedAt: string | null;
}

interface NavodayaStudentProgress {
  id: number;
  name: string;
  examGrade: string;
  medium: string;
  location: string;
  mobileNumber: string;
  totalQuizzes: number;
  averageScore: number;
  sessions: NavodayaStudentSession[];
}

interface ChapterPracticeStudentSession {
  id: number;
  subject: string;
  chapterName: string;
  score: number | null;
  totalQuestions: number | null;
  completedAt: string | null;
}

interface ChapterPracticeStudentProgress {
  id: number;
  name: string;
  schoolName: string | null;
  grade: string;
  board: string;
  medium: string;
  location: string;
  mobileNumber: string;
  totalQuizzes: number;
  averageScore: number;
  sessions: ChapterPracticeStudentSession[];
}

interface VisitorStats {
  totalVisitors: number;
  totalUniqueVisitors: number;
  todayVisitors: number;
  todayUniqueVisitors: number;
  dailyStats: Array<{ date: string; totalVisitors: number; uniqueVisitors: number }>;
}

interface Notice {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  isActive: boolean | null;
  priority: number | null;
  createdAt: string | null;
  expiresAt: string | null;
}

interface UnifiedStudent {
  id: number;
  name: string;
  fatherName: string;
  location: string;
  mobileNumber: string;
  schoolName: string | null;
  dateOfBirth: string | null;
  createdAt: string | null;
}

interface CombinedStudent {
  id: number;
  name: string;
  mobileNumber: string;
  location: string | null;
  fatherName?: string | null;
  schoolName?: string | null;
  examTypes: string[];
  source: string;
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
  const [editingStudent, setEditingStudent] = useState<StudentProgress | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    grade: string;
    board: string;
    location: string;
    mobileNumber: string;
  }>({ name: "", grade: "", board: "", location: "", mobileNumber: "" });
  const [studentTab, setStudentTab] = useState<"allRegistered" | "board" | "cpct" | "navodaya" | "chapterPractice">("allRegistered");
  const [chapterPracticeGradeFilter, setChapterPracticeGradeFilter] = useState<string>("all");
  const [expandedChapterPracticeStudent, setExpandedChapterPracticeStudent] = useState<number | null>(null);
  const [expandedCpctStudent, setExpandedCpctStudent] = useState<number | null>(null);
  const [expandedNavodayaStudent, setExpandedNavodayaStudent] = useState<number | null>(null);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: "", subtitle: "", description: "", priority: 0 });
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  
  // Combined student edit/delete state
  const [editingCombinedStudent, setEditingCombinedStudent] = useState<CombinedStudent | null>(null);
  const [deletingCombinedStudent, setDeletingCombinedStudent] = useState<CombinedStudent | null>(null);
  const [combinedEditForm, setCombinedEditForm] = useState({
    name: "",
    fatherName: "",
    location: "",
    schoolName: "",
  });

  const handleTabChange = (tab: "allRegistered" | "board" | "cpct" | "navodaya" | "chapterPractice") => {
    setStudentTab(tab);
    setExpandedStudent(null);
    setExpandedCpctStudent(null);
    setExpandedNavodayaStudent(null);
    setExpandedChapterPracticeStudent(null);
  };

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

  const { data: unifiedStudents, isLoading: unifiedStudentsLoading } = useQuery<UnifiedStudent[]>({
    queryKey: ["/api/admin/unified-students"],
    enabled: isAuthenticated,
  });

  const { data: allRegisteredStudents, isLoading: allRegisteredStudentsLoading } = useQuery<CombinedStudent[]>({
    queryKey: ["/api/admin/all-registered-students"],
    enabled: isAuthenticated,
  });

  const { data: students, isLoading: studentsLoading } = useQuery<StudentProgress[]>({
    queryKey: ["/api/admin/students"],
    enabled: isAuthenticated,
  });

  const { data: cpctStudents, isLoading: cpctStudentsLoading } = useQuery<CpctStudentProgress[]>({
    queryKey: ["/api/admin/cpct-students"],
    enabled: isAuthenticated,
  });

  const { data: navodayaStudents, isLoading: navodayaStudentsLoading } = useQuery<NavodayaStudentProgress[]>({
    queryKey: ["/api/admin/navodaya-students"],
    enabled: isAuthenticated,
  });

  const { data: contactSubmissions, isLoading: contactsLoading } = useQuery<ContactSubmission[]>({
    queryKey: ["/api/admin/contact-submissions"],
    enabled: isAuthenticated,
  });

  const { data: visitorStats, isLoading: visitorStatsLoading } = useQuery<VisitorStats>({
    queryKey: ["/api/admin/analytics/visitors"],
    enabled: isAuthenticated,
  });

  const { data: notices, isLoading: noticesLoading } = useQuery<Notice[]>({
    queryKey: ["/api/admin/notices"],
    enabled: isAuthenticated,
  });

  const { data: chapterPracticePdfs, isLoading: chapterPracticePdfsLoading } = useQuery<Pdf[]>({
    queryKey: ["/api/admin/chapter-practice-pdfs"],
    enabled: isAuthenticated,
  });

  const { data: chapterPracticeStudents, isLoading: chapterPracticeStudentsLoading } = useQuery<ChapterPracticeStudentProgress[]>({
    queryKey: ["/api/admin/chapter-practice-students"],
    enabled: isAuthenticated,
  });

  const CHAPTER_PRACTICE_GRADES = ["6th", "7th", "8th", "9th", "10th"];

  const filteredChapterPracticeStudents = chapterPracticeStudents?.filter(
    student => chapterPracticeGradeFilter === "all" || student.grade === chapterPracticeGradeFilter
  );

  const createNoticeMutation = useMutation({
    mutationFn: async (data: { title: string; subtitle?: string; description?: string; priority?: number }) => {
      const response = await apiRequest("POST", "/api/admin/notices", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Notice Created", description: "The notice has been added to the board." });
      setShowNoticeForm(false);
      setNoticeForm({ title: "", subtitle: "", description: "", priority: 0 });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notices"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateNoticeMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [key: string]: unknown }) => {
      const response = await apiRequest("PATCH", `/api/admin/notices/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Notice Updated", description: "The notice has been updated." });
      setEditingNotice(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notices"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteNoticeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/notices/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Notice Deleted", description: "The notice has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notices"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chapter-practice-pdfs"] });
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
        title: "PDF Archived",
        description: "The PDF has been archived. Quiz history is preserved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdfs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chapter-practice-pdfs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Archive Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/pdfs/${id}/restore`);
    },
    onSuccess: () => {
      toast({
        title: "PDF Restored",
        description: "The PDF is now active and available for quizzes.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdfs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chapter-practice-pdfs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Restore Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reparseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/reparse-all-pdfs");
      return response.json();
    },
    onSuccess: (data: { message: string; results: { filename: string; oldCount: number; newCount: number; status: string }[] }) => {
      const successResults = data.results.filter(r => r.status === "success");
      const changedResults = successResults.filter(r => r.oldCount !== r.newCount);
      
      toast({
        title: "PDFs Re-parsed",
        description: `${successResults.length} PDFs processed. ${changedResults.length} had question count changes.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pdfs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Re-parse Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof editFormData }) => {
      const response = await apiRequest("PATCH", `/api/admin/students/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Student Updated",
        description: "Student details have been updated successfully.",
      });
      setEditingStudent(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/students/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Student Deleted",
        description: "Student and all their quiz data have been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      queryClient.refetchQueries({ queryKey: ["/api/leaderboard/weekly"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCpctStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/cpct-students/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "CPCT Student Deleted",
        description: "Student and all their quiz data have been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cpct-students"] });
      queryClient.refetchQueries({ queryKey: ["/api/leaderboard/weekly"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNavodayaStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/navodaya-students/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Navodaya Student Deleted",
        description: "Student and all their quiz data have been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/navodaya-students"] });
      queryClient.refetchQueries({ queryKey: ["/api/leaderboard/weekly"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Combined student mutations
  const updateCombinedStudentMutation = useMutation({
    mutationFn: async ({ mobileNumber, data }: { mobileNumber: string; data: typeof combinedEditForm }) => {
      await apiRequest("PATCH", `/api/admin/student/${mobileNumber}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Student Updated",
        description: "Student information has been updated.",
      });
      setEditingCombinedStudent(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-registered-students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unified-students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCombinedStudentMutation = useMutation({
    mutationFn: async (mobileNumber: string) => {
      await apiRequest("DELETE", `/api/admin/student/${mobileNumber}`);
    },
    onSuccess: () => {
      toast({
        title: "Student Deleted",
        description: "Student and all their exam data have been removed from all tables.",
      });
      setDeletingCombinedStudent(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-registered-students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/unified-students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cpct-students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/navodaya-students"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditCombinedStudent = (student: CombinedStudent) => {
    setEditingCombinedStudent(student);
    setCombinedEditForm({
      name: student.name,
      fatherName: student.fatherName || "",
      location: student.location || "",
      schoolName: student.schoolName || "",
    });
  };

  const handleSaveCombinedStudent = () => {
    if (editingCombinedStudent) {
      updateCombinedStudentMutation.mutate({
        mobileNumber: editingCombinedStudent.mobileNumber,
        data: combinedEditForm,
      });
    }
  };

  const handleDeleteCombinedStudent = () => {
    if (deletingCombinedStudent) {
      deleteCombinedStudentMutation.mutate(deletingCombinedStudent.mobileNumber);
    }
  };

  const handleEditStudent = (student: StudentProgress) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name,
      grade: student.grade,
      board: student.board,
      location: student.location,
      mobileNumber: student.mobileNumber,
    });
  };

  const handleSaveStudent = () => {
    if (editingStudent) {
      updateStudentMutation.mutate({ id: editingStudent.id, data: editFormData });
    }
  };

  const handleDeleteStudent = (studentId: number) => {
    if (window.confirm("Are you sure you want to delete this student? This will also delete all their quiz history.")) {
      deleteStudentMutation.mutate(studentId);
    }
  };

  const handleDeleteCpctStudent = (studentId: number) => {
    if (window.confirm("Are you sure you want to delete this CPCT student? This will also delete all their quiz history.")) {
      deleteCpctStudentMutation.mutate(studentId);
    }
  };

  const handleDeleteNavodayaStudent = (studentId: number) => {
    if (window.confirm("Are you sure you want to delete this Navodaya student? This will also delete all their quiz history.")) {
      deleteNavodayaStudentMutation.mutate(studentId);
    }
  };

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

  const validateFilename = (filename: string): { isValid: boolean; error?: string; type?: string } => {
    // Check for CPCT section format: CPCT_{section}.pdf (e.g., CPCT_MS_Office.pdf)
    const cpctMatch = filename.match(/^CPCT_(.+)\.pdf$/i);
    if (cpctMatch) {
      return { isValid: true, type: "cpct" };
    }
    
    // Check for Navodaya section format: grade_navodaya_{section}.pdf (e.g., 9th_navodaya_mathematics.pdf)
    const navodayaSectionMatch = filename.match(/^(\d+(?:st|nd|rd|th)?|6th|9th)_navodaya_(.+)\.pdf$/i);
    if (navodayaSectionMatch) {
      return { isValid: true, type: "navodaya" };
    }
    
    // Check for Navodaya simple format: grade_navodaya.pdf (e.g., 6th_navodaya.pdf)
    const navodayaSimpleMatch = filename.match(/^(\d+(?:st|nd|rd|th)?|6th|9th)_navodaya\.pdf$/i);
    if (navodayaSimpleMatch) {
      return { isValid: true, type: "navodaya" };
    }
    
    // Check for Chapter Practice format: grade_board_chapter_plan_subject.pdf (e.g., 8th_MP_Chapter_Plan_Mathematics.pdf)
    const chapterPracticeMatch = filename.match(/^(\d+(?:st|nd|rd|th))_([A-Za-z]+)_Chapter_Plan_(.+)\.pdf$/i);
    if (chapterPracticeMatch) {
      const [, grade, board, subject] = chapterPracticeMatch;
      if (!CHAPTER_PRACTICE_GRADES.includes(grade)) {
        return { isValid: false, error: `Invalid grade "${grade}" for Chapter Practice. Use: ${CHAPTER_PRACTICE_GRADES.join(", ")}` };
      }
      if (!VALID_BOARDS.includes(board.toUpperCase())) {
        return { isValid: false, error: `Invalid board "${board}". Use: ${VALID_BOARDS.join(", ")}` };
      }
      if (!VALID_SUBJECTS.includes(subject)) {
        return { isValid: false, error: `Invalid subject "${subject}". Use: ${VALID_SUBJECTS.join(", ")}` };
      }
      return { isValid: true, type: "chapter_practice" };
    }
    
    // Check for Board Exam format: grade_board_subject.pdf
    const boardMatch = filename.match(/^(.+)_(.+)_(.+)\.pdf$/i);
    if (!boardMatch) {
      return { isValid: false, error: "Format must be: grade_board_subject.pdf (Board Exam), grade_board_Chapter_Plan_subject.pdf (Chapter Practice), CPCT_{section}.pdf (CPCT), or grade_navodaya_{section}.pdf (Navodaya)" };
    }
    
    const [, grade, board, subject] = boardMatch;
    
    if (!VALID_GRADES.includes(grade)) {
      return { isValid: false, error: `Invalid grade "${grade}". Use: ${VALID_GRADES.join(", ")}` };
    }
    if (!VALID_BOARDS.includes(board.toUpperCase())) {
      return { isValid: false, error: `Invalid board "${board}". Use: ${VALID_BOARDS.join(", ")}` };
    }
    if (!VALID_SUBJECTS.includes(subject)) {
      return { isValid: false, error: `Invalid subject "${subject}". Use: ${VALID_SUBJECTS.join(", ")}` };
    }
    
    return { isValid: true, type: "board" };
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
              Upload PDF files with one of these naming formats:
              <br />
              <strong>Board Exam:</strong> <code className="bg-muted px-1 py-0.5 rounded text-sm">grade_board_subject.pdf</code> (e.g., <code className="bg-muted px-1 py-0.5 rounded text-sm">10th_MP_Science.pdf</code>)
              <br />
              <strong>CPCT:</strong> <code className="bg-muted px-1 py-0.5 rounded text-sm">CPCT_Year.pdf</code> (e.g., <code className="bg-muted px-1 py-0.5 rounded text-sm">CPCT_2024.pdf</code>)
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
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded PDFs
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reparseMutation.mutate()}
                disabled={reparseMutation.isPending || !pdfs || pdfs.length === 0}
                data-testid="button-reparse-all-pdfs"
              >
                <RotateCcw className={`h-4 w-4 mr-2 ${reparseMutation.isPending ? 'animate-spin' : ''}`} />
                {reparseMutation.isPending ? "Re-parsing..." : "Re-parse All PDFs"}
              </Button>
            </div>
            <CardDescription>
              These PDFs are used to generate quiz questions for students. Use "Re-parse All PDFs" after deployment to apply parser updates to existing PDFs.
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
              <div className="space-y-4">
                {/* Active PDFs */}
                {pdfs.filter(p => !p.isArchived).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Active PDFs</p>
                    {pdfs.filter(p => !p.isArchived).map((pdf) => (
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
                            data-testid={`button-archive-pdf-${pdf.id}`}
                            title="Archive PDF (preserves quiz history)"
                          >
                            <Archive className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Archived PDFs */}
                {pdfs.filter(p => p.isArchived).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Archived PDFs</p>
                    {pdfs.filter(p => p.isArchived).map((pdf) => (
                      <div
                        key={pdf.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg opacity-70"
                        data-testid={`pdf-item-archived-${pdf.id}`}
                      >
                        <Archive className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{pdf.filename}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {pdf.grade}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {pdf.board}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {pdf.subject}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Archived
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => restoreMutation.mutate(pdf.id)}
                            disabled={restoreMutation.isPending}
                            data-testid={`button-restore-pdf-${pdf.id}`}
                            title="Restore PDF"
                          >
                            <RotateCcw className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chapter Practice PDFs Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-600" />
              Chapter Practice PDFs
            </CardTitle>
            <CardDescription>
              PDFs for Chapter Practice feature. Format: grade_board_Chapter_Plan_subject.pdf (e.g., 8th_MP_Chapter_Plan_Mathematics.pdf)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chapterPracticePdfsLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : !chapterPracticePdfs || chapterPracticePdfs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No Chapter Practice PDFs uploaded yet. Upload PDFs with the format: grade_board_Chapter_Plan_subject.pdf
              </p>
            ) : (
              <div className="space-y-3">
                {chapterPracticePdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg"
                    data-testid={`chapter-practice-pdf-${pdf.id}`}
                  >
                    <FileText className="h-5 w-5 flex-shrink-0 text-violet-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{pdf.filename}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
                          {pdf.grade}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
                          {pdf.board.replace('_Chapter_Plan', '')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
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
                        data-testid={`button-preview-chapter-pdf-${pdf.id}`}
                        title="Preview PDF content"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(pdf.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-archive-chapter-pdf-${pdf.id}`}
                        title="Archive PDF"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
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
                  Student Dashboard
                </CardTitle>
                <CardDescription>
                  View all registered students and exam performance
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
            <div className="flex items-center gap-2 mb-4 border-b pb-3 flex-wrap">
              <Button
                variant={studentTab === "allRegistered" ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabChange("allRegistered")}
                data-testid="tab-all-registered-students"
              >
                All Registered ({allRegisteredStudents?.length || 0})
              </Button>
              <Button
                variant={studentTab === "board" ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabChange("board")}
                data-testid="tab-board-students"
              >
                Board Exam ({students?.length || 0})
              </Button>
              <Button
                variant={studentTab === "cpct" ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabChange("cpct")}
                data-testid="tab-cpct-students"
              >
                CPCT ({cpctStudents?.length || 0})
              </Button>
              <Button
                variant={studentTab === "navodaya" ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabChange("navodaya")}
                data-testid="tab-navodaya-students"
              >
                Navodaya ({navodayaStudents?.length || 0})
              </Button>
              <Button
                variant={studentTab === "chapterPractice" ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabChange("chapterPractice")}
                data-testid="tab-chapter-practice-students"
                className="bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 hover:bg-violet-200 dark:hover:bg-violet-900"
              >
                Chapter Practice ({chapterPracticeStudents?.length || 0})
              </Button>
            </div>

            {studentTab === "allRegistered" && (
              <>
                {allRegisteredStudentsLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading students...</p>
                ) : !allRegisteredStudents || allRegisteredStudents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No students registered yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      {allRegisteredStudents.map((student, index) => (
                        <div
                          key={`${student.source}-${student.id}-${index}`}
                          className="border rounded-lg p-4"
                          data-testid={`combined-student-row-${student.mobileNumber}`}
                        >
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="font-medium">{student.name}</p>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Mobile:</span>{" "}
                                  {student.mobileNumber}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Father:</span>{" "}
                                  {student.fatherName || "N/A"}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Location:</span>{" "}
                                  {student.location || "N/A"}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">School:</span>{" "}
                                  {student.schoolName || "N/A"}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditCombinedStudent(student)}
                                data-testid={`button-edit-student-${student.mobileNumber}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeletingCombinedStudent(student)}
                                data-testid={`button-delete-student-${student.mobileNumber}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {studentTab === "board" && (
              <>
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
                          <div className="mt-3 pt-2 border-t flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadCSV([student.id])}
                              data-testid={`button-download-student-${student.id}`}
                            >
                              <Download className="h-3 w-3 mr-2" />
                              Download Report
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStudent(student);
                              }}
                              data-testid={`button-edit-student-${student.id}`}
                            >
                              <Pencil className="h-3 w-3 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStudent(student.id);
                              }}
                              disabled={deleteStudentMutation.isPending}
                              data-testid={`button-delete-student-${student.id}`}
                            >
                              <Trash2 className="h-3 w-3 mr-2 text-destructive" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
              </>
            )}

            {studentTab === "cpct" && (
              <>
                {cpctStudentsLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading CPCT students...</p>
                ) : !cpctStudents || cpctStudents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No CPCT students registered yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cpctStudents.map((student) => (
                      <div
                        key={student.id}
                        className="border rounded-lg overflow-hidden"
                        data-testid={`cpct-student-row-${student.id}`}
                      >
                        <div 
                          className="flex items-center gap-3 p-3 bg-muted/50 cursor-pointer"
                          onClick={() => setExpandedCpctStudent(expandedCpctStudent === student.id ? null : student.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{student.name}</p>
                              <Badge variant="secondary" className="text-xs">{student.medium}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{student.mobileNumber}</p>
                          </div>
                          <div className="text-right mr-2">
                            <p className="font-medium">{student.totalQuizzes} quizzes</p>
                            <p className="text-sm text-muted-foreground">
                              {student.averageScore}% avg
                            </p>
                          </div>
                          {expandedCpctStudent === student.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        {expandedCpctStudent === student.id && (
                          <div className="p-3 border-t bg-background">
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              <div>
                                <span className="text-muted-foreground">Location:</span> {student.location}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Medium:</span> {student.medium}
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
                                    <span>CPCT Quiz</span>
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
                            <div className="mt-3 pt-2 border-t flex items-center gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCpctStudent(student.id);
                                }}
                                disabled={deleteCpctStudentMutation.isPending}
                                data-testid={`button-delete-cpct-student-${student.id}`}
                              >
                                <Trash2 className="h-3 w-3 mr-2 text-destructive" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {studentTab === "navodaya" && (
              <>
                {navodayaStudentsLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading Navodaya students...</p>
                ) : !navodayaStudents || navodayaStudents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No Navodaya students registered yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {navodayaStudents.map((student) => (
                      <div
                        key={student.id}
                        className="border rounded-lg overflow-hidden"
                        data-testid={`navodaya-student-row-${student.id}`}
                      >
                        <div 
                          className="flex items-center gap-3 p-3 bg-muted/50 cursor-pointer"
                          onClick={() => setExpandedNavodayaStudent(expandedNavodayaStudent === student.id ? null : student.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{student.name}</p>
                              <Badge variant="secondary" className="text-xs">{student.examGrade}</Badge>
                              <Badge variant="secondary" className="text-xs">{student.medium}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{student.mobileNumber}</p>
                          </div>
                          <div className="text-right mr-2">
                            <p className="font-medium">{student.totalQuizzes} quizzes</p>
                            <p className="text-sm text-muted-foreground">
                              {student.averageScore}% avg
                            </p>
                          </div>
                          {expandedNavodayaStudent === student.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        {expandedNavodayaStudent === student.id && (
                          <div className="p-3 border-t bg-background">
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              <div>
                                <span className="text-muted-foreground">Location:</span> {student.location}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Grade/Medium:</span> {student.examGrade} / {student.medium}
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
                                    <span>Navodaya ({session.examGrade})</span>
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
                            <div className="mt-3 pt-2 border-t flex items-center gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNavodayaStudent(student.id);
                                }}
                                disabled={deleteNavodayaStudentMutation.isPending}
                                data-testid={`button-delete-navodaya-student-${student.id}`}
                              >
                                <Trash2 className="h-3 w-3 mr-2 text-destructive" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {studentTab === "chapterPractice" && (
              <>
                {/* Grade Filter */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-sm text-muted-foreground">Filter by Grade:</span>
                  <Button
                    variant={chapterPracticeGradeFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChapterPracticeGradeFilter("all")}
                    data-testid="filter-grade-all"
                    className={chapterPracticeGradeFilter === "all" ? "bg-violet-600 hover:bg-violet-700" : ""}
                  >
                    All ({chapterPracticeStudents?.length || 0})
                  </Button>
                  {CHAPTER_PRACTICE_GRADES.map(grade => {
                    const count = chapterPracticeStudents?.filter(s => s.grade === grade).length || 0;
                    return (
                      <Button
                        key={grade}
                        variant={chapterPracticeGradeFilter === grade ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChapterPracticeGradeFilter(grade)}
                        data-testid={`filter-grade-${grade}`}
                        className={chapterPracticeGradeFilter === grade ? "bg-violet-600 hover:bg-violet-700" : ""}
                      >
                        {grade} ({count})
                      </Button>
                    );
                  })}
                </div>

                {chapterPracticeStudentsLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading students...</p>
                ) : !filteredChapterPracticeStudents || filteredChapterPracticeStudents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {chapterPracticeGradeFilter === "all" 
                      ? "No Chapter Practice students registered yet."
                      : `No students in ${chapterPracticeGradeFilter} grade.`}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredChapterPracticeStudents.map((student) => (
                      <div
                        key={student.id}
                        className="border border-violet-200 dark:border-violet-800 rounded-lg overflow-hidden"
                        data-testid={`chapter-practice-student-row-${student.id}`}
                      >
                        <div 
                          className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-950/30 cursor-pointer"
                          onClick={() => setExpandedChapterPracticeStudent(
                            expandedChapterPracticeStudent === student.id ? null : student.id
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{student.name}</p>
                              <Badge variant="secondary" className="text-xs bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
                                {student.grade}
                              </Badge>
                              <Badge variant="secondary" className="text-xs bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
                                {student.board}
                              </Badge>
                              {student.schoolName && (
                                <Badge variant="outline" className="text-xs">
                                  {student.schoolName}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{student.mobileNumber} - {student.location}</p>
                          </div>
                          <div className="text-right mr-2">
                            <p className="font-medium">{student.totalQuizzes} quizzes</p>
                            <p className="text-sm text-muted-foreground">
                              {student.averageScore}% avg
                            </p>
                          </div>
                          <ChevronDown 
                            className={`h-5 w-5 transition-transform ${
                              expandedChapterPracticeStudent === student.id ? "rotate-180" : ""
                            }`} 
                          />
                        </div>
                        
                        {expandedChapterPracticeStudent === student.id && (
                          <div className="p-3 border-t border-violet-200 dark:border-violet-800 bg-background">
                            {student.sessions.length > 0 ? (
                              <div className="space-y-1">
                                <p className="text-sm font-medium mb-2">Quiz History:</p>
                                {student.sessions.map((session) => (
                                  <div 
                                    key={session.id}
                                    className="flex items-center justify-between text-sm p-2 bg-violet-50 dark:bg-violet-950/30 rounded"
                                  >
                                    <span>{session.subject} - {session.chapterName}</span>
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
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Visitor Stats & Contact Submissions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Visitor Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Website Analytics
              </CardTitle>
              <CardDescription>
                Track website visitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {visitorStatsLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : visitorStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-3xl font-bold">{visitorStats.totalVisitors}</p>
                      <p className="text-sm text-muted-foreground">Total Page Views</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-3xl font-bold">{visitorStats.totalUniqueVisitors}</p>
                      <p className="text-sm text-muted-foreground">Unique Visitors</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-3xl font-bold">{visitorStats.todayVisitors}</p>
                      <p className="text-sm text-muted-foreground">Today Views</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-3xl font-bold">{visitorStats.todayUniqueVisitors}</p>
                      <p className="text-sm text-muted-foreground">Today Unique</p>
                    </div>
                  </div>
                  {visitorStats.dailyStats.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recent Days</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {visitorStats.dailyStats.slice(0, 7).map((stat) => (
                          <div key={stat.date} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                            <span>{new Date(stat.date).toLocaleDateString("en-IN", { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            <span className="font-medium">{stat.totalVisitors} views / {stat.uniqueVisitors || 0} unique</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No visitor data yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Contact Submissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Contact Form Submissions
              </CardTitle>
              <CardDescription>
                Trial requests from the contact page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contactsLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : contactSubmissions && contactSubmissions.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {contactSubmissions.map((submission) => (
                    <div 
                      key={submission.id} 
                      className="p-3 bg-muted rounded-lg"
                      data-testid={`contact-submission-${submission.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{submission.name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{submission.contactNumber}</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {submission.createdAt 
                            ? new Date(submission.createdAt).toLocaleDateString("en-IN", { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No contact form submissions yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notice Board Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notice Board
                </CardTitle>
                <CardDescription>
                  Manage announcements shown on the landing page
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setShowNoticeForm(true)}
                data-testid="button-add-notice"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Notice
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showNoticeForm && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/50 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium">New Notice</h4>
                  <Button size="icon" variant="ghost" onClick={() => setShowNoticeForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notice-title">Title (required)</Label>
                  <Input
                    id="notice-title"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Main heading for the notice"
                    data-testid="input-notice-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notice-subtitle">Subtitle (optional)</Label>
                  <Input
                    id="notice-subtitle"
                    value={noticeForm.subtitle}
                    onChange={(e) => setNoticeForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Sub heading or date"
                    data-testid="input-notice-subtitle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notice-description">Description (optional)</Label>
                  <Textarea
                    id="notice-description"
                    value={noticeForm.description}
                    onChange={(e) => setNoticeForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="2-3 lines of additional details"
                    rows={3}
                    data-testid="input-notice-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notice-priority">Priority (higher = shown first)</Label>
                  <Input
                    id="notice-priority"
                    type="number"
                    value={noticeForm.priority}
                    onChange={(e) => setNoticeForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    data-testid="input-notice-priority"
                  />
                </div>
                <Button
                  onClick={() => createNoticeMutation.mutate(noticeForm)}
                  disabled={!noticeForm.title.trim() || createNoticeMutation.isPending}
                  data-testid="button-save-notice"
                >
                  {createNoticeMutation.isPending ? "Saving..." : "Save Notice"}
                </Button>
              </div>
            )}
            {noticesLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : notices && notices.length > 0 ? (
              <div className="space-y-3">
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    className={`p-4 rounded-lg border ${notice.isActive ? 'bg-background' : 'bg-muted/50 opacity-60'}`}
                    data-testid={`notice-item-${notice.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{notice.title}</h4>
                          {notice.priority !== null && notice.priority > 0 && (
                            <Badge variant="secondary" className="text-xs">Priority: {notice.priority}</Badge>
                          )}
                          {!notice.isActive && (
                            <Badge variant="outline" className="text-xs">Hidden</Badge>
                          )}
                        </div>
                        {notice.subtitle && (
                          <p className="text-sm text-muted-foreground mt-1">{notice.subtitle}</p>
                        )}
                        {notice.description && (
                          <p className="text-sm mt-2">{notice.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={notice.isActive ?? false}
                            onCheckedChange={(checked) => updateNoticeMutation.mutate({ id: notice.id, isActive: checked })}
                            data-testid={`switch-notice-active-${notice.id}`}
                          />
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Delete this notice?")) {
                              deleteNoticeMutation.mutate(notice.id);
                            }
                          }}
                          data-testid={`button-delete-notice-${notice.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No notices yet. Add one to display on the landing page.
              </p>
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

      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Student
            </DialogTitle>
            <DialogDescription>
              Update student details below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-edit-student-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-grade">Grade</Label>
                <Select
                  value={editFormData.grade}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, grade: value }))}
                >
                  <SelectTrigger id="edit-grade" data-testid="select-edit-student-grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-board">Board</Label>
                <Select
                  value={editFormData.board}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, board: value }))}
                >
                  <SelectTrigger id="edit-board" data-testid="select-edit-student-board">
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_BOARDS.map((board) => (
                      <SelectItem key={board} value={board}>{board}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editFormData.location}
                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                data-testid="input-edit-student-location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mobile">Mobile Number</Label>
              <Input
                id="edit-mobile"
                value={editFormData.mobileNumber}
                onChange={(e) => setEditFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                data-testid="input-edit-student-mobile"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingStudent(null)}
                data-testid="button-cancel-edit-student"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveStudent}
                disabled={updateStudentMutation.isPending}
                data-testid="button-save-student"
              >
                {updateStudentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Combined Student Dialog */}
      <Dialog open={!!editingCombinedStudent} onOpenChange={(open) => !open && setEditingCombinedStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Student
            </DialogTitle>
            <DialogDescription>
              Update student registration details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="combined-edit-name">Name</Label>
              <Input
                id="combined-edit-name"
                value={combinedEditForm.name}
                onChange={(e) => setCombinedEditForm(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-combined-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="combined-edit-father">Father's Name</Label>
              <Input
                id="combined-edit-father"
                value={combinedEditForm.fatherName}
                onChange={(e) => setCombinedEditForm(prev => ({ ...prev, fatherName: e.target.value }))}
                data-testid="input-combined-edit-father"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="combined-edit-location">Location</Label>
              <Input
                id="combined-edit-location"
                value={combinedEditForm.location}
                onChange={(e) => setCombinedEditForm(prev => ({ ...prev, location: e.target.value }))}
                data-testid="input-combined-edit-location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="combined-edit-school">School Name</Label>
              <Input
                id="combined-edit-school"
                value={combinedEditForm.schoolName}
                onChange={(e) => setCombinedEditForm(prev => ({ ...prev, schoolName: e.target.value }))}
                data-testid="input-combined-edit-school"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Mobile: {editingCombinedStudent?.mobileNumber} (cannot be changed)
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingCombinedStudent(null)}
                data-testid="button-cancel-combined-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCombinedStudent}
                disabled={updateCombinedStudentMutation.isPending}
                data-testid="button-save-combined-student"
              >
                {updateCombinedStudentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Combined Student Confirmation Dialog */}
      <Dialog open={!!deletingCombinedStudent} onOpenChange={(open) => !open && setDeletingCombinedStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Student
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="font-medium mb-2">You are about to delete:</p>
              <p className="text-sm"><strong>Name:</strong> {deletingCombinedStudent?.name}</p>
              <p className="text-sm"><strong>Mobile:</strong> {deletingCombinedStudent?.mobileNumber}</p>
              <p className="text-sm mt-2 text-destructive">
                This will permanently delete this student and ALL their quiz history from every exam type (Board, CPCT, Navodaya, etc.)
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeletingCombinedStudent(null)}
                data-testid="button-cancel-combined-delete"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCombinedStudent}
                disabled={deleteCombinedStudentMutation.isPending}
                data-testid="button-confirm-combined-delete"
              >
                {deleteCombinedStudentMutation.isPending ? "Deleting..." : "Delete Student"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
