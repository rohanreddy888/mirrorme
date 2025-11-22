export default function XIcon({
  width = 24,
  height = 24,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      fill="currentColor"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      className={className}
    >
      <title>X</title>
      <path d="M17.8048 2.96973H20.8705L14.1394 10.6338L22.0034 21.0304H15.8321L11.0004 14.7125L5.46893 21.0304H2.40328L9.53424 12.8331L2.00342 2.96973H8.32798L12.6932 8.74114L17.8048 2.96973ZM16.7318 19.231H18.4313L7.43494 4.70248H5.60888L16.7318 19.231Z"></path>
    </svg>
  );
}
