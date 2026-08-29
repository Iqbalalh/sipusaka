import React, { ReactNode, forwardRef } from "react";

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  children: ReactNode; // Button text or content
  size?: "sm" | "md" | "xs"; // Button size
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  type?: "submit" | "reset" | "button";
}

// forwardRef + prop spread are required so overlay triggers (antd Popconfirm/
// Tooltip/Dropdown) can attach their ref and injected handlers — without them
// the trigger silently does nothing on antd v6 / React 19.
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      size = "md",
      variant = "primary",
      startIcon,
      endIcon,
      className = "",
      disabled = false,
      type,
      ...rest
    },
    ref,
  ) => {
    // Size Classes
    const sizeClasses = {
      xs: "px-2 py-2 text-sm",
      sm: "px-4 py-2.5 text-sm h-10",
      md: "px-5 py-3.5 text-sm",
    };

    // Variant Classes
    const variantClasses = {
      primary:
        "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
      outline:
        "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition ${className} ${
          sizeClasses[size]
        } ${variantClasses[variant]} ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
        disabled={disabled}
        type={type}
        {...rest}
      >
        {startIcon && <span className="flex items-center">{startIcon}</span>}
        {children}
        {endIcon && <span className="flex items-center">{endIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
