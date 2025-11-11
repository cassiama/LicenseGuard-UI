import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-2xl text-base font-bold leading-6 tracking-[0.24px] transition-all disabled:pointer-events-none disabled:opacity-50 outline-none",
  {
    variants: {
      variant: {
        primary: "bg-[#3C83F6] text-white p-5 hover:bg-[#3C83F6]/90",
        secondary: "bg-[#192734] text-white p-5 hover:bg-[#192734]/90",
        link: "text-[#97A2B5] p-5 hover:text-[#97A2B5]/80 [&_svg]:fill-[#97A2B5] hover:[&_svg]:fill-[#97A2B5]/80 [&_svg]:transition-all",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

function Button({
  className,
  variant,
  asChild = false,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, className }))}
      {...props}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </Comp>
  )
}

export { Button, buttonVariants }
