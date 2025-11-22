import Link from "next/link";
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center h-full">
     <div className="flex flex-col items-center justify-center gap-2">
     <h1 className="text-9xl font-black">404</h1>
     <p className="text-lg">The page you are looking for does not exist.</p>
     </div>
      <Link href="/" className="bg-white text-secondary px-4 py-2 rounded-full font-semibold text-lg">Go back</Link>
    </div>
  );
}