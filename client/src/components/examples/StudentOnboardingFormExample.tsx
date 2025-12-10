import StudentOnboardingForm from "../StudentOnboardingForm";

export default function StudentOnboardingFormExample() {
  return (
    <StudentOnboardingForm 
      onSubmit={(data) => console.log("Student registered:", data)} 
    />
  );
}
