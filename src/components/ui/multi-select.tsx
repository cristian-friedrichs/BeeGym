import * as React from "react";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type Option = {
    label: string;
    value: string;
};

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Selecione...",
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const handleUnselect = (item: string) => {
        onChange(selected.filter((i) => i !== item));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-auto min-h-10 hover:bg-background",
                        selected.length > 0 ? "h-auto" : "h-10",
                        className
                    )}
                >
                    <div className="flex flex-wrap gap-1 items-center">
                        {selected.length === 0 && (
                            <span className="text-muted-foreground font-normal">
                                {placeholder}
                            </span>
                        )}
                        {selected.map((item) => {
                            const option = options.find((o) => o.value === item);
                            return (
                                <Badge variant="secondary" key={item} className="mr-1 mb-1" onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnselect(item);
                                }}>
                                    {option?.label || item}
                                    <X className="ml-1 h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" />
                                </Badge>
                            );
                        })}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar..." />
                    <CommandList>
                        <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label} // Usamos label para busca visual
                                    onSelect={() => {
                                        const isSelected = selected.includes(option.value);
                                        if (isSelected) {
                                            onChange(selected.filter((item) => item !== option.value));
                                        } else {
                                            onChange([...selected, option.value]);
                                        }
                                        // Mantém aberto para selecionar múltiplos
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selected.includes(option.value)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
