import QuizQuestion from "../QuizQuestion";

const mockQuestion = {
  id: 1,
  question: "What is the primary function of mitochondria in a cell?",
  options: [
    "Protein synthesis",
    "Energy production (ATP)",
    "Waste removal",
    "Cell division"
  ],
  correctAnswer: 1,
  explanation: "Mitochondria are known as the 'powerhouse of the cell' because they generate most of the cell's supply of adenosine triphosphate (ATP), which is used as a source of chemical energy. They convert nutrients into ATP through cellular respiration."
};

export default function QuizQuestionExample() {
  return (
    <QuizQuestion
      question={mockQuestion}
      currentQuestion={3}
      totalQuestions={10}
      onAnswer={(selected, isCorrect) => console.log("Answer:", selected, "Correct:", isCorrect)}
      onNext={() => console.log("Next question")}
    />
  );
}
