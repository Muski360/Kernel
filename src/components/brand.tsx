import Image from "next/image";

export function Brand() {
  return (
    <span className="brand">
      <Image
        src="/brand/kernel-white.png"
        width={2000}
        height={2000}
        alt="KERNEL"
        className="brand-image"
        sizes="160px"
        loading="eager"
      />
    </span>
  );
}
