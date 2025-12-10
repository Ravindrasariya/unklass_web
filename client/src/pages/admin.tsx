import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Upload, FileText, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export default function AdminPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { data: pdfs, isLoading } = useQuery<Pdf[]>({
    queryKey: ["/api/admin/pdfs"],
  });

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage PDF study materials for quiz generation
          </p>
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
