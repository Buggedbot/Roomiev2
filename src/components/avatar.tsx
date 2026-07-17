function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Avatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={cx("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cx(
        "flex items-center justify-center rounded-full bg-primary font-bold text-primary-foreground",
        className
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
