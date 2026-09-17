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

export function BlogReviewEmail({
  topicTitle,
  failureReason,
  editUrl,
}: {
  topicTitle: string;
  failureReason: string;
  editUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>A blog post failed automatic validation and needs manual review.</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: bodyFont, margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "32px 24px" }}>
          <Heading
            as="h1"
            style={{ fontSize: "20px", fontWeight: 600, color: "#000000", margin: "0 0 20px" }}
          >
            A blog post failed automatic validation and needs manual review.
          </Heading>

          <Section>
            <Field label="Topic" value={topicTitle} />

            <Text style={{ fontSize: "14px", lineHeight: 1.6, color: "#000000", margin: "0 0 4px" }}>
              <strong>Failure reason:</strong>
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
              {failureReason}
            </Text>

            <Text style={{ fontSize: "14px", lineHeight: 1.6, color: "#000000", margin: 0 }}>
              It has been saved as a draft, so it is not visible on the site.
            </Text>
          </Section>

          <Section style={{ marginTop: "24px" }}>
            <Link
              href={editUrl}
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
              Edit it in admin
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

export default BlogReviewEmail;
