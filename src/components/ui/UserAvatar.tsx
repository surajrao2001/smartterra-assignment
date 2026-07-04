export function UserAvatar({ name }: { name: string }) {
    const initials = name
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {initials}
            </div>
            <span className="text-sm font-medium text-text">{name}</span>
        </div>
    );
}
