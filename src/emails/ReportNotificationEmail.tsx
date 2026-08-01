import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const bodyFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ fontSize: "14px", lineHeight: 1.6, color: "#000000", margin: "0 0 12px" }}>
      <strong>{label}:</strong> {value}
    </Text>
  );
}

export function ReportNotificationEmail({
  postContent,
  reason,
  reportedByUsername,
  postAuthorUsername,
  circleName,
  adminUrl,
}: {
  postContent: string;
  reason: string;
  reportedByUsername: string;
  postAuthorUsername: string;
  circleName: string;
  adminUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>A new report was submitted.</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: bodyFont, margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "32px 24px" }}>
          <Heading
            as="h1"
            style={{ fontSize: "20px", fontWeight: 600, color: "#000000", margin: "0 0 20px" }}
          >
            A new report was submitted.
          </Heading>

          <Section>
            <Text style={{ fontSize: "14px", lineHeight: 1.6, color: "#000000", margin: "0 0 4px" }}>
              <strong>Reported post content:</strong>
            </Text>
            <Text
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#000000",
                whiteSpace: "pre-wrap",
                border: "1px solid #dddddd",
                borderRadius: "4px",
                padding: "12px",
                margin: "0 0 16px",
              }}
            >
              {postContent}
            </Text>

            <Field label="Reason" value={reason} />
            <Field label="Reported by" value={reportedByUsername} />
            <Field label="Post author" value={postAuthorUsername} />
            <Field label="Circle" value={circleName} />
          </Section>

          <Section style={{ marginTop: "24px" }}>
            <Link
              href={adminUrl}
              style={{
                backgroundColor: "#000000",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Review in admin panel
            </Link>
          </Section>

          <Hr style={{ borderColor: "#dddddd", margin: "32px 0 16px" }} />

          <Text style={{ fontSize: "12px", lineHeight: 1.6, color: "#666666", margin: 0 }}>
            This is an automated notification from Between Us.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ReportNotificationEmail;
