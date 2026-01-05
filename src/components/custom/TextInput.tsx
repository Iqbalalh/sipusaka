import { Input } from "antd";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

export const TextInput = ({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: TextInputProps) => (
  <Input
    className="w-full"
    size="large"
    type={type}
    required={required}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
  />
);