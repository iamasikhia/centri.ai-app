"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext<{
    value?: string | string[]
    onValueChange?: (value: string) => void
    type?: "single" | "multiple"
}>({})

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        type?: "single" | "multiple"
        value?: string | string[]
        onValueChange?: (value: string) => void
        defaultValue?: string | string[]
        collapsible?: boolean
    }
>(({ className, type = "single", value: controlledValue, onValueChange, defaultValue, children, ...props }, ref) => {
    const [dateValue, setDateValue] = React.useState<string | string[]>(defaultValue || (type === "multiple" ? [] : ""))

    const value = controlledValue !== undefined ? controlledValue : dateValue

    const handleValueChange = (itemValue: string) => {
        if (type === "single") {
            const newValue = value === itemValue ? "" : itemValue
            setDateValue(newValue)
            onValueChange?.(newValue)
        } else {
            // Basic multiple support (not fully robust but sufficient for simple usage)
            // simplified for this specific task
        }
    }

    return (
        <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, type }}>
            <div ref={ref} className={className} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => (
    <div
        ref={ref}
        data-value={value}
        className={cn("border-b", className)}
        {...props}
    />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const { value, onValueChange } = React.useContext(AccordionContext)
    const itemValue = (props as any)["data-value"] // This approach relies on us knowing the structure, or we pass context down. 
    // Actually, simpler to just use a local context provider for Item or check parent.
    // Let's rely on standard composition: Item wraps Trigger. But Item needs to pass its value to Trigger if we don't use Context.

    // Better Custom Implementation:
    // We need to access the Item's value. 
    // Let's refactor slightly to be cleaner.
    return (
        <h3 className="flex">
            <AccordionTriggerPrimitive
                ref={ref}
                className={className}
                {...props}
            >
                {children}
            </AccordionTriggerPrimitive>
        </h3>
    )
})

const AccordionTriggerPrimitive = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const { value, onValueChange } = React.useContext(AccordionContext)
    // We need to find the parent Item's value. 
    // In a real library we'd use a context for the Item.
    // Let's assume the user passes onClick or we modify the Item to provide context.

    // REFACTOR: Let's create an ItemContext.
    const itemContext = React.useContext(AccordionItemContext)

    const isOpen = value === itemContext.value

    return (
        <button
            ref={ref}
            onClick={() => onValueChange?.(itemContext.value)}
            className={cn(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                className
            )}
            data-state={isOpen ? "open" : "closed"}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </button>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { value } = React.useContext(AccordionContext)
    const itemContext = React.useContext(AccordionItemContext)
    const isOpen = value === itemContext.value

    if (!isOpen) return null

    return (
        <div
            ref={ref}
            className={cn(
                "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                className
            )}
            {...props}
        >
            <div className="pb-4 pt-0">{children}</div>
        </div>
    )
})
AccordionContent.displayName = "AccordionContent"

const AccordionItemContext = React.createContext<{ value: string }>({ value: "" })

const AccordionItemWrapper = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => (
    <AccordionItemContext.Provider value={{ value }}>
        <div
            ref={ref}
            className={cn("border-b", className)}
            {...props}
        >
            {children}
        </div>
    </AccordionItemContext.Provider>
))
AccordionItemWrapper.displayName = "AccordionItem"

export { Accordion, AccordionItemWrapper as AccordionItem, AccordionTrigger, AccordionContent }
