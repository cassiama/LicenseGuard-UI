import * as React from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  label?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onRightIconClick?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, leftIcon, rightIcon, onRightIconClick, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-white font-medium text-base leading-6">
            {label}
          </label>
        )}
        <div className="relative flex items-center h-14 rounded-lg border border-[#314668] bg-[#192734]">
          {leftIcon && (
            <span className="shrink-0 ml-4 [&_svg]:w-6 [&_svg]:h-7">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "flex-1 h-full bg-transparent px-4 text-white text-base placeholder:text-[#97A2B5] outline-none",
              leftIcon && "pl-2",
              rightIcon && "pr-2",
              className
            )}
            {...props}
          />
          {rightIcon && (
            onRightIconClick ? (
              <button
                type="button"
                onClick={onRightIconClick}
                className="shrink-0 mr-4 [&_svg]:w-6 [&_svg]:h-7 cursor-pointer outline-none"
              >
                {rightIcon}
              </button>
            ) : (
              <span className="shrink-0 mr-4 [&_svg]:w-6 [&_svg]:h-7">
                {rightIcon}
              </span>
            )
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input";

export { Input };
