import { DecisionBrief } from "./decision-brief";

export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DecisionBrief id={id} />;
}
