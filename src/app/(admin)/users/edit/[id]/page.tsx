import UserForm from "@/components/custom/form/UserForm";

export default function EditUserPage({ params }: { params: { id: string } }) {
  return <UserForm mode="edit" userId={params.id} />;
}
