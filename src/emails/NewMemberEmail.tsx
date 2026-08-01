import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

const INK = "#2B221C";

export function NewMemberEmail({ circleUrl }: { circleUrl: string }) {
  return (
    <EmailLayout
      previewText="Someone new joined your circle."
      heading="Your circle just grew."
      ctaLabel="Go to your circle"
      ctaUrl={circleUrl}
    >
      <Text style={{ fontSize: "15px", lineHeight: 1.7, color: INK, margin: 0 }}>
        A new member has joined your circle. Welcome them when you are
        ready.
      </Text>
    </EmailLayout>
  );
}

export default NewMemberEmail;
