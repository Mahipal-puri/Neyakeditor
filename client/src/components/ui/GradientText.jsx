export default function GradientText({ children, className = '', as: Tag = 'span' }) {
  return (
    <Tag
      className={`bg-grad-neon bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient-shift ${className}`}
    >
      {children}
    </Tag>
  );
}
