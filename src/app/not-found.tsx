import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid place-items-center w-full h-full">
      <div className="flex flex-col gap-3 items-center">
        <h2 className="text-3xl md:text-5xl font-bold">Not Found</h2>
        <p>Could not find requested resource</p>
        <Link href="/">Return Home</Link>
      </div>
    </div>
  );
}
