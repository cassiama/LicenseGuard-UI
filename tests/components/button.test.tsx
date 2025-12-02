import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
  describe("Variant Rendering", () => {
    it("should render primary variant with correct classes", () => {
      render(<Button variant="primary">Primary Button</Button>);
      
      const button = screen.getByRole("button", { name: /primary button/i });
      expect(button).toBeDefined();
      // TODO: replace this hex code with a custom color 
      // (so you can test "bg-{color}")
      expect(button.className).toContain("bg-[#3C83F6]");
      expect(button.className).toContain("text-white");
    });

    it("should render secondary variant with correct classes", () => {
      render(<Button variant="secondary">Secondary Button</Button>);
      
      const button = screen.getByRole("button", { name: /secondary button/i });
      expect(button).toBeDefined();
      // TODO: replace this hex code with a custom color 
      // (so you can test "bg-{color}")
      expect(button.className).toContain("bg-[#192734]");
      expect(button.className).toContain("text-white");
    });

    it("should render link variant with correct classes", () => {
      render(<Button variant="link">Link Button</Button>);
      
      const button = screen.getByRole("button", { name: /link button/i });
      expect(button).toBeDefined();
      // TODO: replace this hex code with a custom color 
      // (so you can test "bg-{color}")
      expect(button.className).toContain("text-[#97A2B5]");
    });

    it("should render primary variant by default when no variant is specified", () => {
      render(<Button>Default Button</Button>);
      
      const button = screen.getByRole("button", { name: /default button/i });
      expect(button).toBeDefined();
      // TODO: replace this hex code with a custom color 
      // (so you can test "bg-{color}")
      expect(button.className).toContain("bg-[#3C83F6]");
      expect(button.className).toContain("text-white");
    });

    it("should apply common classes to all variants", () => {
      const { rerender } = render(<Button variant="primary">Test</Button>);
      let button = screen.getByRole("button");
      
      expect(button.className).toContain("inline-flex");
      expect(button.className).toContain("items-center");
      expect(button.className).toContain("justify-center");
      expect(button.className).toContain("rounded-2xl");
      
      rerender(<Button variant="secondary">Test</Button>);
      button = screen.getByRole("button");
      expect(button.className).toContain("inline-flex");
      expect(button.className).toContain("rounded-2xl");
      
      rerender(<Button variant="link">Test</Button>);
      button = screen.getByRole("button");
      expect(button.className).toContain("inline-flex");
      expect(button.className).toContain("rounded-2xl");
    });
  });

  describe("Icon Rendering", () => {
    it("should render leftIcon before button text", () => {
      const LeftIconComponent = () => <span data-testid="left-icon">←</span>;
      render(
        <Button leftIcon={<LeftIconComponent />}>
          Button Text
        </Button>
      );
      
      const button = screen.getByRole("button");
      const leftIcon = screen.getByTestId("left-icon");
      
      expect(leftIcon).toBeDefined();
      expect(button.textContent).toBe("←Button Text");
      
      // verify icon is wrapped in span with the 
      // "shrink-0" class
      const iconWrapper = leftIcon.parentElement;
      expect(iconWrapper?.className).toContain("shrink-0");
    });

    it("should render rightIcon after button text", () => {
      const RightIconComponent = () => <span data-testid="right-icon">→</span>;
      render(
        <Button rightIcon={<RightIconComponent />}>
          Button Text
        </Button>
      );
      
      const button = screen.getByRole("button");
      const rightIcon = screen.getByTestId("right-icon");
      
      expect(rightIcon).toBeDefined();
      expect(button.textContent).toBe("Button Text→");
      
      // verify icon is wrapped in span with the 
      // "shrink-0" class
      const iconWrapper = rightIcon.parentElement;
      expect(iconWrapper?.className).toContain("shrink-0");
    });

    it("should render both leftIcon and rightIcon correctly", () => {
      const LeftIconComponent = () => <span data-testid="left-icon">←</span>;
      const RightIconComponent = () => <span data-testid="right-icon">→</span>;
      render(
        <Button 
          leftIcon={<LeftIconComponent />}
          rightIcon={<RightIconComponent />}
        >
          Button Text
        </Button>
      );
      
      const button = screen.getByRole("button");
      const leftIcon = screen.getByTestId("left-icon");
      const rightIcon = screen.getByTestId("right-icon");
      
      expect(leftIcon).toBeDefined();
      expect(rightIcon).toBeDefined();
      expect(button.textContent).toBe("←Button Text→");
    });

    it("should render button without icons when not provided", () => {
      render(<Button>Just Text</Button>);
      
      const button = screen.getByRole("button");
      expect(button.textContent).toBe("Just Text");
      
      // verify no icon wrappers exist
      const spans = button.querySelectorAll("span");
      expect(spans.length).toBe(0);
    });

    it("should render SVG icons correctly", () => {
      const SvgIcon = () => (
        <svg data-testid="svg-icon" width="16" height="16">
          <circle cx="8" cy="8" r="8" />
        </svg>
      );
      
      render(
        <Button leftIcon={<SvgIcon />}>
          With SVG
        </Button>
      );
      
      const svgIcon = screen.getByTestId("svg-icon");
      expect(svgIcon).toBeDefined();
      expect(svgIcon.tagName).toBe("svg");
    });
  });

  describe("Disabled State", () => {
    it("should prevent click events when disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
      );
      
      const button = screen.getByRole("button", { name: /disabled button/i });
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should apply disabled styling", () => {
      render(<Button disabled>Disabled Button</Button>);
      
      const button = screen.getByRole("button", { name: /disabled button/i });
      expect(button.className).toContain("disabled:pointer-events-none");
      expect(button.className).toContain("disabled:opacity-50");
      expect(button).toHaveProperty("disabled", true);
    });

    it("should allow click events when not disabled", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <Button onClick={handleClick}>
          Enabled Button
        </Button>
      );
      
      const button = screen.getByRole("button", { name: /enabled button/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should work with disabled state across all variants", () => {
      const { rerender } = render(
        <Button variant="primary" disabled>Primary</Button>
      );
      let button = screen.getByRole("button");
      expect(button).toHaveProperty("disabled", true);
      
      rerender(<Button variant="secondary" disabled>Secondary</Button>);
      button = screen.getByRole("button");
      expect(button).toHaveProperty("disabled", true);
      
      rerender(<Button variant="link" disabled>Link</Button>);
      button = screen.getByRole("button");
      expect(button).toHaveProperty("disabled", true);
    });
  });

  describe("className Merging with cn()", () => {
    it("should merge custom className with variant classes", () => {
      render(
        <Button variant="primary" className="custom-class">
          Custom Button
        </Button>
      );
      
      const button = screen.getByRole("button", { name: /custom button/i });
      expect(button.className).toContain("custom-class");
      // TODO: replace this hex code with a custom color 
      // (so you can test "bg-{color}")
      expect(button.className).toContain("bg-[#3C83F6]");
    });

    it("should allow custom padding to override default padding", () => {
      render(
        <Button variant="primary" className="p-2">
          Custom Padding
        </Button>
      );
      
      const button = screen.getByRole("button", { name: /custom padding/i });
      // tailwind-merge should keep p-2 and remove p-5
      expect(button.className).toContain("p-2");
      expect(button.className).not.toContain("p-5");
    });

    it("should allow custom background color to override variant background", () => {
      render(
        <Button variant="primary" className="bg-red-500">
          Custom Background
        </Button>
      );
      
      const button = screen.getByRole("button", { name: /custom background/i });
      // tailwind-merge should keep the last bg-* class (bg-red-500)
      expect(button.className).toContain("bg-red-500");
      // the hover state remains since it doesn't conflict with base bg
      // TODO: replace this hex code with a custom color 
      // (so you can test "bg-{color}")
      expect(button.className).toContain("hover:bg-[#3C83F6]/90");
    });

    it("should merge multiple custom classes correctly", () => {
      render(
        <Button className="custom-1 custom-2 custom-3">
          Multiple Classes
        </Button>
      );
      
      const button = screen.getByRole("button", { name: /multiple classes/i });
      expect(button.className).toContain("custom-1");
      expect(button.className).toContain("custom-2");
      expect(button.className).toContain("custom-3");
    });

    it("should handle conflicting utility classes correctly", () => {
      render(
        <Button variant="primary" className="text-black hover:text-gray-500">
          Conflicting Text
        </Button>
      );
      
      const button = screen.getByRole("button", { name: /conflicting text/i });
      // tailwind-merge should resolve conflicts
      expect(button.className).toContain("text-black");
      expect(button.className).not.toContain("text-white");
    });

    it("should preserve non-conflicting classes from both sources", () => {
      render(
        <Button variant="primary" className="shadow-lg border-2">
          Combined Classes
        </Button>
      );
      
      const button = screen.getByRole("button", { name: /combined classes/i });
      // should have both variant classes and custom classes
      expect(button.className).toContain("shadow-lg");
      expect(button.className).toContain("border-2");
      // TODO: replace this hex code with a custom color 
      // (so you can test "bg-{color}")
      expect(button.className).toContain("bg-[#3C83F6]");
      expect(button.className).toContain("rounded-2xl");
    });
  });

  describe("Additional Props and Attributes", () => {
    it("should have data-slot attribute", () => {
      render(<Button>Test Button</Button>);
      
      const button = screen.getByRole("button");
      expect(button.getAttribute("data-slot")).toBe("button");
    });

    it("should accept and apply standard button HTML attributes", () => {
      render(
        <Button 
          type="submit" 
          name="submit-button"
          aria-label="Submit form"
        >
          Submit
        </Button>
      );
      
      const button = screen.getByRole("button", { name: /submit form/i });
      expect(button.getAttribute("type")).toBe("submit");
      expect(button.getAttribute("name")).toBe("submit-button");
      expect(button.getAttribute("aria-label")).toBe("Submit form");
    });

    it("should forward onClick handler", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      const button = screen.getByRole("button", { name: /click me/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should pass event object to onClick handler", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      const button = screen.getByRole("button", { name: /click me/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
      expect(handleClick.mock.calls[0][0]).toHaveProperty("type", "click");
    });

    it("should render children correctly", () => {
      render(
        <Button>
          <span>Complex</span> <strong>Children</strong>
        </Button>
      );
      
      const button = screen.getByRole("button");
      expect(button.querySelector("span")).toBeDefined();
      expect(button.querySelector("strong")).toBeDefined();
      expect(button.textContent).toBe("Complex Children");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty children", () => {
      render(<Button></Button>);
      
      const button = screen.getByRole("button");
      expect(button).toBeDefined();
      expect(button.textContent).toBe("");
    });

    it("should handle null/undefined icons gracefully", () => {
      render(
        <Button leftIcon={null} rightIcon={undefined}>
          Button
        </Button>
      );
      
      const button = screen.getByRole("button");
      expect(button.textContent).toBe("Button");
    });

    it("should handle multiple clicks", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Multi Click</Button>);
      
      const button = screen.getByRole("button", { name: /multi click/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it("should work with all variants and icons together", () => {
      const LeftIcon = () => <span data-testid="left">←</span>;
      const RightIcon = () => <span data-testid="right">→</span>;
      
      const { rerender } = render(
        <Button 
          variant="primary" 
          leftIcon={<LeftIcon />} 
          rightIcon={<RightIcon />}
        >
          Primary
        </Button>
      );
      
      let button = screen.getByRole("button");
      // TODO: replace this hex code with a custom color 
      // (so you can test "bg-{color}")
      expect(button.className).toContain("bg-[#3C83F6]");
      expect(screen.getByTestId("left")).toBeDefined();
      expect(screen.getByTestId("right")).toBeDefined();
      
      rerender(
        <Button 
          variant="secondary" 
          leftIcon={<LeftIcon />} 
          rightIcon={<RightIcon />}
        >
          Secondary
        </Button>
      );
      
      button = screen.getByRole("button");
      // TODO: replace this hex code with a custom color 
      // (so you can test "bg-{color}")
      expect(button.className).toContain("bg-[#192734]");
      expect(screen.getByTestId("left")).toBeDefined();
      expect(screen.getByTestId("right")).toBeDefined();
    });
  });
});
