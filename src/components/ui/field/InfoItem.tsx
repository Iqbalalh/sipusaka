export const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <p className="mb-1 text-md leading-normal text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="text-md font-medium text-gray-800 dark:text-white/90">
      {value || "-"}
    </p>
  </div>
);