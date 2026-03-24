import LetterForm from "@/components/custom/form/LetterForm";

interface EditLetterPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLetterPage({ params }: EditLetterPageProps) {
  const { id } = await params;
  return <LetterForm mode="edit" letterId={id} />;
}
