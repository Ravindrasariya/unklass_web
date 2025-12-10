import QuizResults from "../QuizResults";

export default function QuizResultsExample() {
  return (
    <QuizResults
      score={9}
      totalQuestions={10}
      onRetakeQuiz={() => console.log("Retake quiz clicked")}
      onUploadNew={() => console.log("Upload new document clicked")}
    />
  );
}
