// Solito is not compatible with React Router v7
// This is a no-op provider for React Router builds
export const SolitoImageProvider = ({
  children,
}: {
  children: React.ReactNode
}): React.ReactNode => {
  return <>{children}</>
}