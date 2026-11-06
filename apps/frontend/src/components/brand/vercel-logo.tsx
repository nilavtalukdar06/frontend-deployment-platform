import type { SVGProps } from "react";

function VercelLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="115"
      height="100"
      fill="none"
      viewBox="0 0 115 100"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M57.5 0 115 100H0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export { VercelLogo };
