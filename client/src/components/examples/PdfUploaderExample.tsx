import PdfUploader from "../PdfUploader";

export default function PdfUploaderExample() {
  return (
    <PdfUploader 
      onFileSelect={(file) => console.log("File selected:", file.name)}
      onGenerateQuiz={() => console.log("Generate quiz clicked")}
      isGenerating={false}
    />
  );
}
