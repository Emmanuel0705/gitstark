import { auth } from "@/auth";
import Chat from "@/components/chat";
import LandingPage from "@/components/views/landing-page";
// import { OnboardingDialogue } from "@/components/onboarding-dialogue";

export default async function Home() {
  const session = await auth();

  if (session?.accessToken)
    return (
      <div className="h-[90vh] font-[family-name:var(--font-geist-sans)]">
        <Chat
          agentId={`b850bc30-45f8-0041-a00a-83df46d8555d`}
          userImage={session?.user?.image as string}
          userName={session?.user?.name as string}
          accessToken={session?.accessToken as string}
        />
        {/* <OnboardingDialogue /> */}
      </div>
    );

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      <LandingPage />
    </div>
  );
}
