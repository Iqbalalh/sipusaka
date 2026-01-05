import { Option } from "@/types/generic/select-option";
import { Select } from "antd";

import filterOption from "@/utils/formatter/antdSelectFilter";

interface SelectInputProps {
  value: any;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
}

export const SelectInput = ({
  value,
  onChange,
  options,
  placeholder,
}: SelectInputProps) => (
  <Select
    size="large"
    showSearch={{
      filterOption: filterOption,
    }}
    style={{ width: "100%" }}
    options={options}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    allowClear
  />
);