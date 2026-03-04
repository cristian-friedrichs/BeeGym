import * as LucideIcons from "lucide-react";

interface DynamicIconProps {
    name?: string | null;
    className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
    if (!name) return <LucideIcons.Dumbbell className={className} />;

    try {
        // Normaliza: "activity" -> "Activity"
        const normalizedName = name.charAt(0).toUpperCase() + name.slice(1);

        // Busca no Lucide de forma segura
        const IconComponent = (LucideIcons as any)[normalizedName] || (LucideIcons as any)[name] || LucideIcons.Dumbbell;

        return <IconComponent className={className} />;
    } catch (error) {
        return <LucideIcons.Dumbbell className={className} />;
    }
}
