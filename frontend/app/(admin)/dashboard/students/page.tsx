import { getStudents } from "@/app/actions/students";
import StudentsClient from "@/components/StudentsClient";
import { verifyUniversityAccess } from "@/app/actions/auth";


export default async function StudentsPage() {
  // 1. Get the current wallet address. 
  // NOTE: Replace this line with how you retrieve the active user's address 
  // (e.g., from your session, or a 'getWalletFromSession' helper function)
  const currentWallet = "0xbaaf2d1903b72e650ef1370cec457590d7984546"; 

  // 2. Call the function with the wallet argument
  const auth = await verifyUniversityAccess(currentWallet);
  
  // 3. Validation: Check 'auth.success' and 'auth.id' 
  // This matches the structure we defined in actions/auth.ts
  if (!auth.success || !auth.id) {
    return <div>Unauthorized: {auth.message || "University ID not found."}</div>;
  }

  // 4. Fetch students using the ID from the successful auth result
  const students = await getStudents(auth.id);

  // 5. Render the client component with the retrieved ID
  return (
    <StudentsClient 
      students={students || []} 
      universityId={auth.id} 
    />
  );
}