// apps/web/app/(root)/user/thank-you/page.tsx
import GlassDiv from "@/components/ui/GlassDiv";
import GlassButton from "@/components/ui/GlassButton";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassDiv className="p-8 text-center space-y-4">
        <h1 className="text-3xl font-bold">Thank you!</h1>
        <p>Your order is confirmed. We’ll deliver to you shortly.</p>
        <GlassButton href="/user" className="!bg-orange-500 !text-white">
          Back to Home
        </GlassButton>
      </GlassDiv>
    </div>
  );
}
