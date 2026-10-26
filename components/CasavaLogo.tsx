type CasavaLogoProps = {
  className?: string;
  height?: number;
};

export default function CasavaLogo({
  className = "",
  height = 28,
}: CasavaLogoProps) {
  const width = Math.round((height / 30) * 132);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/casava-logo.svg"
      alt="Casava"
      width={width}
      height={height}
      className={className}
    />
  );
}
