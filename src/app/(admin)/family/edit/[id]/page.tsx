import FamilyForm from "@/components/custom/form/FamilyForm";

export default function EditFamilyPage({
  params,
}: {
  params: { id: string };
}) {
  return <FamilyForm mode="edit" familyId={params.id} />;
}
