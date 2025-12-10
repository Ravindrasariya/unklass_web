import QuizResults from "../QuizResults";

export default function QuizResultsExample() {
  return (
    <QuizResults
      score={9}
      totalQuestions={10}
      onRetakeQuiz={() => console.log("Retake quiz clicked")}
      onTryAnotherSubject={() => console.log("Try another subject clicked")}
    />
  );
}
