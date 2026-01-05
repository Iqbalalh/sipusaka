import Label from "../form/Label";

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField = ({ label, required, children }: FormFieldProps) => (
  <div>
    <Label>
      {label} {required && "*"}
    </Label>
    {children}
  </div>
);