const filterOption = (input: string, option: any) => {
  // Access the option's properties directly, e.g., option.label or option.value
  return (
    option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
    option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
  );
};

export default filterOption;
