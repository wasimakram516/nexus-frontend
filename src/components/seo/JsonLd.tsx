interface JsonLdProps {
  data: Record<string, unknown> | readonly Record<string, unknown>[];
}

/** Emits schema.org structured data. "<" is escaped so content can never close the script tag. */
export default function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
